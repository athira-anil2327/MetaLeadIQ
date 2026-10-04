"""
MetaLeadIQ Real-Time Inference Engine
Scores incoming leads in real-time using the trained XGBoost model,
Platt calibrator, and confidence interval formulas.
"""
import logging
import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'base_model.pkl')
FEATURES_PATH = os.path.join(ARTIFACTS_DIR, 'features.pkl')
CALIBRATOR_PATH = os.path.join(ARTIFACTS_DIR, 'calibrator.pkl')

_model = None
_features = None
_calibrator = None


def load_artifacts():
    """Load model, feature schema, and calibrator into memory (singleton)."""
    global _model, _features, _calibrator

    if _model is not None and _features is not None:
        return _model, _features, _calibrator

    logger.info("Loading ML artifacts into memory...")
    if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"Required artifacts missing from {ARTIFACTS_DIR}")

    with open(MODEL_PATH, 'rb') as f:
        _model = pickle.load(f)

    with open(FEATURES_PATH, 'rb') as f:
        _features = pickle.load(f)

    if os.path.exists(CALIBRATOR_PATH):
        with open(CALIBRATOR_PATH, 'rb') as f:
            _calibrator = pickle.load(f)
        logger.info("Loaded Platt calibrator.")
    else:
        _calibrator = None
        logger.warning("Calibrator artifact not found; falling back to raw probabilities.")

    logger.info(f"ML artifacts loaded successfully ({len(_features)} features).")
    return _model, _features, _calibrator


def score_lead(lead_input: dict) -> dict:
    """
    Takes an incoming lead dictionary (e.g. from Meta webhook or user form)
    and computes:
    - base_probability (raw XGBoost output)
    - calibrated_probability (Platt-scaled conversion probability)
    - base_score (0-100)
    - decayed_score (exponential decay based on hours_uncontacted)
    - status (Hot / Warm / Cold)
    - 95% confidence intervals (prediction_lower, prediction_upper)
    - confidence level (High / Moderate / Uncertain)
    """
    model, features, calibrator = load_artifacts()

    # Normalize inputs
    total_visits = float(lead_input.get('total_visits', lead_input.get('TotalVisits', 1)))
    time_on_website = float(lead_input.get('time_on_website', lead_input.get('time_spent', 0.0)))
    if time_on_website < 60 and time_on_website > 0:
        time_on_website_sec = time_on_website * 60.0
    else:
        time_on_website_sec = time_on_website

    lead_source = str(lead_input.get('lead_source', lead_input.get('Lead Source', 'Unknown'))).strip()
    lead_origin = str(lead_input.get('lead_origin', lead_input.get('Lead Origin', 'Unknown'))).strip()
    last_activity = str(lead_input.get('last_activity', lead_input.get('Last Activity', 'Unknown'))).strip()
    occupation = str(lead_input.get('occupation', lead_input.get('What is your current occupation', 'Unknown'))).strip()

    # Build one-row feature vector matching the 42 features
    row_data = {col: 0 for col in features}

    if 'TotalVisits' in row_data:
        row_data['TotalVisits'] = total_visits
    if 'Total Time Spent on Website' in row_data:
        row_data['Total Time Spent on Website'] = time_on_website_sec
    if 'Asymmetrique Activity Score' in row_data:
        row_data['Asymmetrique Activity Score'] = 14.0
    if 'Asymmetrique Profile Score' in row_data:
        row_data['Asymmetrique Profile Score'] = 15.0

    source_col = f"Lead Source_{lead_source}"
    if source_col in row_data:
        row_data[source_col] = 1

    origin_col = f"Lead Origin_{lead_origin}"
    if origin_col in row_data:
        row_data[origin_col] = 1

    activity_col = f"Last Activity_{last_activity}"
    if activity_col in row_data:
        row_data[activity_col] = 1

    occ_col = f"What is your current occupation_{occupation}"
    if occ_col in row_data:
        row_data[occ_col] = 1

    X_single = pd.DataFrame([row_data])[features]

    raw_prob = float(model.predict_proba(X_single)[:, 1][0])

    if calibrator is not None:
        cal_prob = float(calibrator.predict_proba([raw_prob])[:, 1][0])
    else:
        cal_prob = raw_prob

    base_score = int(round(raw_prob * 100))

    hours_uncontacted = float(lead_input.get('hours_uncontacted', 0.0))
    half_life_hours = 24.0
    decay_constant = np.log(2) / half_life_hours
    decayed_score = int(round(base_score * np.exp(-decay_constant * hours_uncontacted)))
    decayed_score = max(0, min(100, decayed_score))

    if decayed_score >= 70:
        status = 'Hot'
    elif decayed_score >= 40:
        status = 'Warm'
    else:
        status = 'Cold'

    p = cal_prob
    base_n = 30.0
    n = base_n + total_visits
    margin = 1.96 * np.sqrt(max(0.0, (p * (1.0 - p)) / n))
    margin_pct = margin * 100

    pred_lower = int(np.clip(round((p - margin) * 100), 0, 100))
    pred_upper = int(np.clip(round((p + margin) * 100), 0, 100))

    if margin_pct <= 5.0:
        confidence = 'High'
    elif margin_pct <= 12.0:
        confidence = 'Moderate'
    else:
        confidence = 'Uncertain'

    submission_time = lead_input.get('submission_time') or lead_input.get('created_at') or datetime.now().isoformat()

    cpc = float(lead_input.get('cpc', lead_input.get('meta_cpc', 1.45)))
    ctr = float(lead_input.get('ctr', lead_input.get('meta_ctr', 2.8)))
    placement = lead_input.get('placement', lead_input.get('meta_ad_placement', 'Feed'))
    audience_type = lead_input.get('audience_type', lead_input.get('meta_audience_type', 'Broad'))
    creative_type = lead_input.get('creative_type', 'Video')

    return {
        'id': lead_input.get('id', f"L-{int(datetime.now().timestamp() % 100000)}"),
        'name': lead_input.get('name', 'Unknown Lead'),
        'email': lead_input.get('email', ''),
        'phone': lead_input.get('phone', ''),
        'lead_source': lead_source,
        'lead_origin': lead_origin,
        'placement': placement,
        'audience_type': audience_type,
        'ctr': round(ctr, 1),
        'cpc': round(cpc, 2),
        'creative_type': creative_type,
        'total_visits': int(total_visits),
        'time_on_website': round(time_on_website_sec / 60.0, 1),
        'page_views': int(lead_input.get('page_views', 1)),
        'last_activity': last_activity,
        'base_score': base_score,
        'base_probability': round(raw_prob, 4),
        'calibrated_probability': round(cal_prob, 4),
        'decayed_score': decayed_score,
        'hours_uncontacted': hours_uncontacted,
        'status': status,
        'confidence': confidence,
        'prediction_lower': pred_lower,
        'prediction_upper': pred_upper,
        'submission_time': submission_time,
        'contacted': int(lead_input.get('contacted', 0)),
        'contacted_at': lead_input.get('contacted_at'),
    }
