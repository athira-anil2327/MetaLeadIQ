"""
MetaLeadIQ End-to-End ML Pipeline
Orchestrates all four member modules in the correct order:
  1. Preprocess → 2. Feature Select → 3. Train Model →
  4. Time Decay → 5. Calibrate → 6. Rank → 7. Export to Frontend
"""
import json
import logging
import os
import sys
import numpy as np
import pandas as pd

# Configure logging for all modules
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('pipeline')

# Ensure backend/src is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data_preprocessing import preprocess_data
from src.synthetic_meta_generator import generate_meta_advertising_data
from src.feature_selection import select_features
from src.train_base_model import train_base_model
from src.time_decay import calculate_time_decay
from src.ranker import evaluate_model_performance, optimize_threshold
from src.confidence_checker import calibrate_model, calculate_confidence_intervals
from src.priority_queue import build_priority_queue


def run_pipeline(raw_path: str = 'backend/data/Leads.csv',
                 num_leads_export: int = 150):
    """Runs the complete MetaLeadIQ ML pipeline."""

    logger.info("=" * 60)
    logger.info("STARTING METALEADIQ ML PIPELINE")
    logger.info("=" * 60)

    # ──────────────────────────────────────────────
    # STEP 1: Load & Preprocess Raw Data (Member 1)
    # ──────────────────────────────────────────────
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw data file not found at {raw_path}")

    df_raw = pd.read_csv(raw_path)
    logger.info(f"Loaded raw dataset: {len(df_raw)} records, {df_raw.shape[1]} columns.")

    df_preprocessed = preprocess_data(df_raw)

    # ──────────────────────────────────────────────
    # STEP 2: Simulate Meta Ad Details (Member 1)
    # ──────────────────────────────────────────────
    df_enriched = generate_meta_advertising_data(df_preprocessed)

    # ──────────────────────────────────────────────
    # STEP 3: Feature Selection BEFORE Training (Member 3)
    # ──────────────────────────────────────────────
    selected_features, importance_df = select_features(df_enriched)
    logger.info(f"Selected {len(selected_features)} features for model training.")

    # ──────────────────────────────────────────────
    # STEP 4: Train Base Model on Selected Features (Member 1)
    # ──────────────────────────────────────────────
    df_scored, X_val, y_val, model = train_base_model(df_enriched, selected_features)

    # ──────────────────────────────────────────────
    # STEP 5: Evaluate Model on VALIDATION SET ONLY (Member 3)
    # ──────────────────────────────────────────────
    val_probs = model.predict_proba(X_val)[:, 1]
    metrics = evaluate_model_performance(y_val.values, val_probs)
    cutoff = optimize_threshold(y_val.values, val_probs)

    # ──────────────────────────────────────────────
    # STEP 6: Calibrate Probabilities (Member 4)
    # ──────────────────────────────────────────────
    calibrated_model = calibrate_model(model, X_val, y_val)

    # ──────────────────────────────────────────────
    # STEP 7: Apply Time Decay Engine (Member 2)
    # ──────────────────────────────────────────────
    df_decayed = calculate_time_decay(df_scored)

    # ──────────────────────────────────────────────
    # STEP 8: Calculate Confidence Intervals (Member 4)
    # ──────────────────────────────────────────────
    df_calibrated = calculate_confidence_intervals(
        df_decayed,
        calibrator=calibrated_model,
        feature_cols=selected_features
    )

    # ──────────────────────────────────────────────
    # STEP 9: Build Priority Queue (Member 3)
    # ──────────────────────────────────────────────
    df_ranked = build_priority_queue(df_calibrated)

    # ──────────────────────────────────────────────
    # STEP 10: Export to React Frontend
    # ──────────────────────────────────────────────
    generate_react_mock_data(df_ranked, num_leads=num_leads_export)

    logger.info("=" * 60)
    logger.info("METALEADIQ ML PIPELINE COMPLETED SUCCESSFULLY!")
    logger.info("=" * 60)

    return df_ranked, metrics


def generate_react_mock_data(df: pd.DataFrame, num_leads: int = 150):
    """
    Takes the top leads from the priority queue and exports them to
    src/data/mockData.ts for the React frontend to consume.

    Uses REAL categorical values preserved from preprocessing.
    """
    logger.info(f"--- Exporting Top {num_leads} Leads to React Frontend ---")

    leads_subset = df.head(num_leads).copy()

    # Realistic name pools
    first_names = [
        "Liam", "Noah", "Oliver", "James", "Elijah", "William", "Henry", "Lucas",
        "Benjamin", "Theodore", "Emma", "Olivia", "Ava", "Isabella", "Sophia",
        "Charlotte", "Mia", "Amelia", "Harper", "Evelyn", "Alexander", "Michael",
        "Daniel", "Ethan", "Matthew", "Jackson", "Sebastian", "Jack", "Aiden", "Owen",
        "Abigail", "Emily", "Elizabeth", "Sofia", "Avery", "Ella", "Scarlett", "Grace",
        "Chloe", "Victoria", "Samuel", "David", "Joseph", "Carter", "Wyatt", "John",
        "Nathan", "Ryan", "Isaac", "Gabriel"
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
        "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
        "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
        "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
        "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
        "Campbell", "Mitchell", "Carter", "Roberts"
    ]

    rng = np.random.default_rng(42)
    creative_types = ['Video', 'Image', 'Carousel']

    leads_list = []
    for idx, (_, row) in enumerate(leads_subset.iterrows()):
        fn = first_names[idx % len(first_names)]
        ln = last_names[(idx * 7) % len(last_names)]
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{idx}@example.com"
        phone = f"+1 (555) {rng.integers(100, 999)}-{rng.integers(1000, 9999)}"

        # Map placement names to frontend-friendly format
        raw_placement = str(row.get('meta_ad_placement', 'Feed'))
        placement_map = {
            'Instagram_Reels': 'Reels',
            'Instagram_Stories': 'Stories',
            'Facebook_Feed': 'Feed',
            'Audience_Network': 'Audience Network',
        }
        placement = placement_map.get(raw_placement, raw_placement)

        # Map audience type
        raw_audience = str(row.get('meta_audience_type', 'Broad'))
        audience_map = {
            'Lookalike_1pct': '1% Lookalike',
        }
        audience = audience_map.get(raw_audience, raw_audience)

        # Use REAL categorical values (preserved in preprocessing)
        lead_source = str(row.get('Lead Source', 'Unknown'))
        lead_origin = str(row.get('Lead Origin', 'Unknown'))
        last_activity = str(row.get('Last Activity', 'Unknown'))
        page_views = float(row.get('Page Views Per Visit', 1.0))
        total_visits = int(row.get('TotalVisits', 1))
        time_on_website = float(row.get('Total Time Spent on Website', 0.0))

        # Use calibrated probability for conversion probability display
        conv_prob = int(round(row.get('calibrated_probability', row.get('base_probability', 0.5)) * 100))

        lead_dict = {
            "id": f"L-{1000 + idx}",
            "name": name,
            "email": email,
            "phone": phone,
            "leadSource": lead_source,
            "leadOrigin": lead_origin,
            "placement": placement,
            "audienceType": audience,
            "ctr": float(round(row.get('meta_ctr', 2.5), 1)),
            "cpc": float(round(row.get('meta_cpc', 1.5), 2)),
            "creativeType": rng.choice(creative_types),
            "totalVisits": total_visits,
            "timeOnWebsite": round(time_on_website / 60, 1),  # seconds → minutes
            "pageViews": int(page_views),
            "lastActivity": last_activity,
            "baseScore": int(row.get('base_score', 50)),
            "currentScore": int(row.get('decayed_score', 50)),
            "conversionProbability": conv_prob,
            "hoursUncontacted": float(round(row.get('hours_uncontacted', 0.0), 1)),
            "status": str(row.get('lead_status', 'Cold')),
            "confidence": str(row.get('confidence', 'Uncertain')),
            "predictionLower": int(row.get('prediction_lower', 40)),
            "predictionUpper": int(row.get('prediction_upper', 60)),
            "submissionTime": str(row.get('created_at', '')),
            "contacted": False,
        }
        leads_list.append(lead_dict)

    # Write to src/data/mockData.ts
    mock_data_content = f"""// Auto-generated by backend/src/pipeline.py — DO NOT EDIT MANUALLY
// Re-run the ML pipeline to update: python backend/src/pipeline.py
export type LeadStatus = 'Hot' | 'Warm' | 'Cold';
export type ConfidenceLevel = 'High' | 'Moderate' | 'Uncertain';

export interface Lead {{
  id: string;
  name: string;
  email: string;
  phone: string;
  leadSource: string;
  leadOrigin: string;
  placement: string;
  audienceType: string;
  ctr: number;
  cpc: number;
  creativeType: string;
  totalVisits: number;
  timeOnWebsite: number;
  pageViews: number;
  lastActivity: string;
  baseScore: number;
  currentScore: number;
  conversionProbability: number;
  hoursUncontacted: number;
  status: LeadStatus;
  confidence: ConfidenceLevel;
  predictionLower: number;
  predictionUpper: number;
  submissionTime: string;
  contacted: boolean;
}}

export const mockLeads: Lead[] = {json.dumps(leads_list, indent=2)};
"""

    target_path = 'src/data/mockData.ts'
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(mock_data_content)

    logger.info(f"React mockData.ts updated with {len(leads_list)} real-model-predicted leads!")


if __name__ == '__main__':
    run_pipeline()
