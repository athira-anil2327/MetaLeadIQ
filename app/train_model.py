"""
Trains the Stage-2 XGBoost propensity model and the Stage-3 Platt calibrator.

You have no historical conversion data yet, so this script generates a
synthetic-but-structured dataset that encodes the qualitative relationships
described in the methodology dossier (more visits/time-on-site raises
propensity; evening Reels traffic converts better; students convert less
than working professionals, etc.). Two things to do before going live:

  1. Once real webhook/CRM data accumulates, replace `generate_synthetic_data()`
     with a loader that reads your actual labeled leads table
     (`SELECT * FROM leads WHERE outcome IS NOT NULL`).
  2. Re-run this script (`python -m app.train_model`) to retrain periodically.

Run with:  python -m app.train_model
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score
import xgboost as xgb

from app.config import settings
from app.ml.features import (
    FEATURE_COLUMNS, OCCUPATIONS, SOURCES, CREATIVE_TYPES, AD_PLACEMENTS,
)

RNG = np.random.default_rng(42)
N_SAMPLES = 6000


def generate_synthetic_data(n=N_SAMPLES) -> pd.DataFrame:
    occupation = RNG.choice(OCCUPATIONS, size=n, p=[0.35, 0.40, 0.15, 0.05, 0.05])
    source = RNG.choice(SOURCES, size=n, p=[0.45, 0.25, 0.20, 0.08, 0.02])
    creative_type = RNG.choice(CREATIVE_TYPES, size=n, p=[0.5, 0.3, 0.15, 0.05])
    ad_placement = RNG.choice(AD_PLACEMENTS, size=n, p=[0.35, 0.30, 0.25, 0.05, 0.05])
    total_visits = RNG.poisson(2.2, size=n) + 1
    time_on_site = np.clip(RNG.exponential(90, size=n), 0, 900).astype(int)
    hour_of_day = RNG.integers(0, 24, size=n)
    is_evening = ((hour_of_day >= 18) & (hour_of_day <= 23)).astype(int)

    occ_effect = np.select(
        [occupation == "working_professional", occupation == "business_owner",
         occupation == "student", occupation == "unemployed"],
        [0.6, 0.5, -0.1, -0.5], default=0.0,
    )
    placement_effect = np.select(
        [ad_placement == "reels", ad_placement == "stories", ad_placement == "feed"],
        [0.45, 0.2, 0.1], default=-0.1,
    )
    creative_effect = np.select(
        [creative_type == "video", creative_type == "carousel"],
        [0.3, 0.1], default=0.0,
    )
    evening_reel_bonus = np.where((is_evening == 1) & (ad_placement == "reels"), 0.35, 0.0)

    logit = (
        -2.1
        + 0.18 * np.log1p(total_visits)
        + 0.0025 * time_on_site
        + occ_effect
        + placement_effect
        + creative_effect
        + evening_reel_bonus
        + RNG.normal(0, 0.6, size=n)  # noise
    )
    p_true = 1 / (1 + np.exp(-logit))
    y = RNG.binomial(1, p_true)

    df = pd.DataFrame({
        "occupation": occupation, "source": source, "creative_type": creative_type,
        "ad_placement": ad_placement, "total_visits": total_visits,
        "time_on_site_seconds": time_on_site, "hour_of_day": hour_of_day,
        "is_evening": is_evening, "converted": y,
    })
    return df


def _one_hot_df(df: pd.DataFrame) -> pd.DataFrame:
    def oh(col, vocab):
        return pd.DataFrame(
            {f"{col}__{v}": (df[col] == v).astype(int) for v in vocab}
        )

    parts = [
        df[["total_visits", "time_on_site_seconds", "hour_of_day", "is_evening"]],
        oh("occupation", OCCUPATIONS),
        oh("source", SOURCES),
        oh("creative_type", CREATIVE_TYPES),
        oh("ad_placement", AD_PLACEMENTS),
    ]
    out = pd.concat(parts, axis=1)
    return out[FEATURE_COLUMNS]


def main():
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    df = generate_synthetic_data()
    X = _one_hot_df(df)
    y = df["converted"].values

    # Stratified train / (val+holdout) split; val used for Platt fitting,
    # holdout used purely for reported metrics (no leakage between the two).
    X_train, X_rest, y_train, y_rest = train_test_split(
        X, y, test_size=0.4, stratify=y, random_state=42
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_rest, y_rest, test_size=0.5, stratify=y_rest, random_state=42
    )

    model = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        gamma=0.5,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # ---- Stage 3: Platt scaling fit strictly on the validation partition ----
    p_val_base = model.predict_proba(X_val)[:, 1]
    calibrator = LogisticRegression()
    calibrator.fit(p_val_base.reshape(-1, 1), y_val)

    # ---- Held-out evaluation (never touched by training or calibration) ----
    p_test_base = model.predict_proba(X_test)[:, 1]
    p_test_cal = calibrator.predict_proba(p_test_base.reshape(-1, 1))[:, 1]
    y_pred = (p_test_cal >= 0.5).astype(int)

    auc = roc_auc_score(y_test, p_test_cal)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    top_decile_cutoff = np.quantile(p_test_cal, 0.9)
    top_mask = p_test_cal >= top_decile_cutoff
    top_decile_precision = y_test[top_mask].mean() if top_mask.sum() else float("nan")

    print("=" * 60)
    print("Held-out test metrics (synthetic data)")
    print("=" * 60)
    print(f"ROC-AUC:              {auc:.4f}")
    print(f"Precision:            {precision:.4f}")
    print(f"Recall:               {recall:.4f}")
    print(f"F1:                   {f1:.4f}")
    print(f"Top-decile precision: {top_decile_precision:.4f}")
    print("=" * 60)

    joblib.dump(model, os.path.join(settings.MODEL_DIR, "xgboost_model.joblib"))
    joblib.dump(calibrator, os.path.join(settings.MODEL_DIR, "platt_calibrator.joblib"))
    print(f"Saved model artifacts to {settings.MODEL_DIR}/")


if __name__ == "__main__":
    main()
