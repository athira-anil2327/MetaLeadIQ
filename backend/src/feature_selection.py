"""
Feature Filtering & Dimensionality Reduction (Member 3 - Step 1)
Evaluates feature importance via SHAP and Random Forest, prunes
low-variance and low-correlation features BEFORE model training.
"""
import logging
import os
import pandas as pd
import numpy as np
import shap
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)

# Columns that should never be pruned or used as model features
NON_FEATURE_COLS = [
    'Prospect ID', 'Lead Number', 'Converted', 'base_score', 'decayed_score',
    'hours_uncontacted', 'lead_status', 'created_at', 'base_probability',
    'meta_cpc', 'meta_ctr', 'meta_ad_placement', 'meta_audience_type',
    'confidence', 'prediction_lower', 'prediction_upper',
    # Raw categorical columns preserved for UI export
    'Lead Origin', 'Lead Source', 'Last Activity', 'Country',
    'Specialization', 'How did you hear about X Education',
    'What is your current occupation', 'What matters most to you in choosing a course',
    'Tags', 'Lead Quality', 'Lead Profile', 'City', 'Last Notable Activity',
    'Asymmetrique Activity Index', 'Asymmetrique Profile Index',
]


def select_features(df: pd.DataFrame, target_col: str = 'Converted',
                    corr_threshold: float = 0.02,
                    artifacts_dir: str = 'backend/artifacts') -> tuple:
    """
    Evaluates features and returns:
    1. The list of selected feature column names (for model training)
    2. A DataFrame of feature importances (saved to disk)
    
    Does NOT modify the input DataFrame — only determines which columns to keep.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in DataFrame.")

    logger.info("--- Running Feature Selection & Pruning (Member 3) ---")

    # Identify numeric candidate features
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    candidate_cols = [c for c in numeric_cols if c not in NON_FEATURE_COLS]

    features_to_drop = []

    # 1. Near-zero variance check
    for col in candidate_cols:
        var = df[col].var()
        if var < 1e-4:
            features_to_drop.append(col)
            logger.debug(f"Pruning low variance: '{col}' (variance={var:.6f})")

    remaining = [c for c in candidate_cols if c not in features_to_drop]

    # 2. Correlation check against target
    for col in remaining:
        corr = df[col].corr(df[target_col])
        if pd.isna(corr) or abs(corr) < corr_threshold:
            features_to_drop.append(col)
            logger.debug(f"Pruning low correlation: '{col}' (corr={corr})")

    selected_features = [c for c in candidate_cols if c not in features_to_drop]
    logger.info(f"Pruned {len(features_to_drop)} features. Keeping {len(selected_features)} features.")

    # 3. Compute Feature Importance (RF + SHAP) on selected features
    X = df[selected_features].fillna(0)
    y = df[target_col]

    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X, y)

    # SHAP TreeExplainer — sample down for speed (1000 rows is sufficient)
    shap_sample_size = min(1000, len(X))
    X_shap = X.sample(n=shap_sample_size, random_state=42)
    explainer = shap.TreeExplainer(rf)
    shap_values = explainer.shap_values(X_shap)

    # Handle SHAP output format
    if isinstance(shap_values, list):
        mean_shap = np.abs(shap_values[1]).mean(axis=0)
    elif hasattr(shap_values, 'values'):
        # shap.Explanation object (newer versions)
        mean_shap = np.abs(shap_values.values).mean(axis=0)
    elif len(shap_values.shape) == 3:
        mean_shap = np.abs(shap_values[:, :, 1]).mean(axis=0)
    else:
        mean_shap = np.abs(shap_values).mean(axis=0)

    importance_df = pd.DataFrame({
        'Feature': X.columns,
        'Mean_SHAP_Value': mean_shap,
        'RF_Importance': rf.feature_importances_
    }).sort_values(by='Mean_SHAP_Value', ascending=False)

    # Save to disk
    os.makedirs(artifacts_dir, exist_ok=True)
    importance_path = os.path.join(artifacts_dir, 'feature_importance.csv')
    importance_df.to_csv(importance_path, index=False)
    logger.info(f"Feature importances saved to {importance_path}")

    logger.info(f"\nTop 10 Feature Importances:\n{importance_df.head(10).to_string(index=False)}")

    return selected_features, importance_df
