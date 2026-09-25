"""
Prediction Confidence & Model Calibration (Member 4 - Step 1)
Calibrates probabilities via Platt Scaling and computes 95% confidence intervals.
"""
import logging
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger(__name__)


class PlattCalibrator:
    """
    Manual Platt Scaling: fits a logistic regression on the base model's
    predicted probabilities vs true labels from the validation set.
    Then transforms any new raw probabilities into calibrated ones.
    """
    def __init__(self):
        self.lr = LogisticRegression()

    def fit(self, base_probs, y_true):
        """Fit sigmoid mapping from raw probabilities to calibrated probabilities."""
        X_cal = base_probs.reshape(-1, 1)
        self.lr.fit(X_cal, y_true)
        logger.info("Platt Scaling calibrator fitted on validation set.")
        return self

    def predict_proba(self, base_probs):
        """Return calibrated probabilities."""
        X_cal = np.asarray(base_probs).reshape(-1, 1)
        return self.lr.predict_proba(X_cal)


def calibrate_model(model, X_val, y_val):
    """
    Applies Platt Scaling (sigmoid calibration) using the validation set.
    Returns a PlattCalibrator that maps raw probabilities → calibrated probabilities.
    """
    logger.info("Calibrating model probabilities via Platt Scaling (sigmoid)...")
    raw_probs = model.predict_proba(X_val)[:, 1]
    calibrator = PlattCalibrator()
    calibrator.fit(raw_probs, y_val)
    logger.info("Model calibration complete.")
    return calibrator


def calculate_confidence_intervals(df: pd.DataFrame,
                                   calibrator=None,
                                   feature_cols: list = None) -> pd.DataFrame:
    """
    Computes calibrated probabilities and 95% binomial confidence intervals.
    
    CI = p ± 1.96 * sqrt(p * (1 - p) / n)
    
    Where n is derived from dataset-level statistics for meaningful margins.
    """
    if 'base_probability' not in df.columns:
        raise ValueError("Column 'base_probability' is required.")

    df = df.copy()
    logger.info(f"--- Calculating Confidence Intervals (Member 4) ---")

    # 1. Use calibrated probabilities if calibrator is available
    if calibrator is not None:
        raw_probs = df['base_probability'].values
        calibrated_probs = calibrator.predict_proba(raw_probs)[:, 1]
        df['calibrated_probability'] = calibrated_probs
        p = calibrated_probs
        logger.info("Using calibrated (Platt-scaled) probabilities.")
    else:
        p = df['base_probability'].values
        df['calibrated_probability'] = p
        logger.warning("No calibrator provided. Using raw base probabilities.")

    # 2. Compute 95% Binomial Confidence Intervals
    # Use a meaningful sample size: sqrt of total dataset size per lead,
    # boosted by engagement signals (total visits + page views)
    base_n = max(np.sqrt(len(df)), 30.0)  # Minimum sample size of 30
    engagement = df['TotalVisits'].fillna(1).values + df.get('Page Views Per Visit', pd.Series(1)).fillna(1).values
    n = base_n + engagement  # More engaged leads get tighter CIs

    margin = 1.96 * np.sqrt((p * (1.0 - p)) / n)

    df['prediction_lower'] = np.clip(np.round((p - margin) * 100), 0, 100).astype(int)
    df['prediction_upper'] = np.clip(np.round((p + margin) * 100), 0, 100).astype(int)

    # 3. Confidence Labeling
    margin_pct = margin * 100
    conditions = [
        margin_pct <= 5.0,
        margin_pct <= 12.0,
    ]
    choices = ['High', 'Moderate']
    df['confidence'] = np.select(conditions, choices, default='Uncertain')

    confidence_counts = pd.Series(df['confidence']).value_counts().to_dict()
    logger.info(f"Confidence distribution: {confidence_counts}")

    return df
