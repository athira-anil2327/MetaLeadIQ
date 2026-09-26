"""
Base Probability Model Training (Member 1 - Step 3)
Trains an XGBoost classifier on selected features and outputs base scores.
"""
import logging
import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)


def train_base_model(df: pd.DataFrame, feature_cols: list,
                     target_col: str = 'Converted',
                     model_out: str = 'backend/artifacts/base_model.pkl',
                     features_out: str = 'backend/artifacts/features.pkl') -> tuple:
    """
    Trains the base conversion probability model.
    
    Args:
        df: Preprocessed DataFrame with all columns.
        feature_cols: List of feature column names to train on (from feature_selection).
        target_col: Name of the target column.
    
    Returns:
        (df_with_scores, X_val, y_val, model)
        - df_with_scores: Original df with 'base_probability' and 'base_score' added.
        - X_val: Validation feature matrix (for downstream evaluation).
        - y_val: Validation labels.
        - model: Trained XGBClassifier.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found.")
    if not feature_cols:
        raise ValueError("feature_cols list is empty. Cannot train model with zero features.")

    logger.info(f"--- Training Base Lead Scoring Model (Member 1) ---")
    logger.info(f"Training on {len(feature_cols)} features, {len(df)} records.")

    y = df[target_col]
    X = df[feature_cols].fillna(0)

    # Train-test split (80/20)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Train XGBoost (no StandardScaler needed — tree models are scale-invariant)
    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
        eval_metric='logloss',
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # Save model and feature list
    os.makedirs(os.path.dirname(model_out), exist_ok=True)
    with open(model_out, 'wb') as f:
        pickle.dump(model, f)
    with open(features_out, 'wb') as f:
        pickle.dump(feature_cols, f)

    logger.info(f"Model saved to {model_out}")
    logger.info(f"Feature list ({len(feature_cols)} features) saved to {features_out}")

    # Score ONLY the validation set first (for honest evaluation)
    val_probs = model.predict_proba(X_val)[:, 1]
    logger.info(f"Validation set mean probability: {val_probs.mean():.4f}")

    # Now score the full dataset for downstream pipeline use
    # Note: Training set scores will be slightly optimistic
    all_probs = model.predict_proba(X)[:, 1]
    df = df.copy()
    df['base_probability'] = all_probs
    df['base_score'] = np.round(all_probs * 100).astype(int)

    return df, X_val, y_val, model
