"""
Stage 2 + 3: load the trained XGBoost model and the Platt-scaling calibrator
(a logistic regression fit on held-out validation predictions), then produce
a calibrated conversion probability for a new lead.
"""
import os
import joblib
import numpy as np

from app.config import settings
from app.ml.features import vectorize

_model = None
_calibrator = None


def _paths():
    return (
        os.path.join(settings.MODEL_DIR, "xgboost_model.joblib"),
        os.path.join(settings.MODEL_DIR, "platt_calibrator.joblib"),
    )


def load_artifacts():
    global _model, _calibrator
    model_path, calib_path = _paths()
    if not (os.path.exists(model_path) and os.path.exists(calib_path)):
        raise FileNotFoundError(
            "Model artifacts not found. Run `python -m app.train_model` first "
            f"(expected files at {model_path} and {calib_path})."
        )
    _model = joblib.load(model_path)
    _calibrator = joblib.load(calib_path)


def is_loaded() -> bool:
    return _model is not None and _calibrator is not None


def score_lead(lead: dict) -> dict:
    """Returns base_score (0-100), calibrated_probability (0-1)."""
    if not is_loaded():
        load_artifacts()

    x = vectorize(lead)
    p_base = float(_model.predict_proba(x)[0, 1])
    base_score = round(p_base * 100, 1)

    # Platt calibrator was fit as a 1-feature logistic regression on p_base
    p_cal = float(_calibrator.predict_proba(np.array([[p_base]]))[0, 1])

    return {
        "base_score": base_score,
        "p_base": p_base,
        "calibrated_probability": round(p_cal, 4),
    }
