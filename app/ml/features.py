"""
Feature engineering shared between training (train_model.py) and inference
(scoring.py) so the one-hot vocabulary never drifts between the two.

Implements the Stage-1 dimensionality reduction described in the dossier at
a practical scale: a fixed, hand-curated categorical vocabulary (the
equivalent output of the variance + correlation + Shapley pruning step)
rather than re-running Shapley pruning on every request.
"""
from datetime import datetime, timezone
import numpy as np

OCCUPATIONS = ["student", "working_professional", "business_owner", "unemployed", "other"]
SOURCES = ["facebook_lead_ad", "instagram_lead_ad", "whatsapp_inbound", "instagram_inbound", "manual"]
CREATIVE_TYPES = ["video", "image", "carousel", "unknown"]
AD_PLACEMENTS = ["feed", "stories", "reels", "audience_network", "unknown"]

FEATURE_COLUMNS = (
    ["total_visits", "time_on_site_seconds", "hour_of_day", "is_evening"]
    + [f"occupation__{v}" for v in OCCUPATIONS]
    + [f"source__{v}" for v in SOURCES]
    + [f"creative_type__{v}" for v in CREATIVE_TYPES]
    + [f"ad_placement__{v}" for v in AD_PLACEMENTS]
)


def _one_hot(value: str, vocab: list[str]) -> list[int]:
    value = (value or "other").lower()
    return [1 if value == v else 0 for v in vocab]


def vectorize(lead: dict, submitted_at: str | None = None) -> np.ndarray:
    """Turn a raw lead dict into the fixed-order numeric feature vector."""
    ts = submitted_at or lead.get("submitted_at")
    try:
        dt = datetime.fromisoformat(ts) if ts else datetime.now(timezone.utc)
    except ValueError:
        dt = datetime.now(timezone.utc)

    hour = dt.hour
    is_evening = 1 if 18 <= hour <= 23 else 0

    row = [
        float(lead.get("total_visits", 1) or 1),
        float(lead.get("time_on_site_seconds", 0) or 0),
        float(hour),
        float(is_evening),
    ]
    row += _one_hot(lead.get("occupation", "other"), OCCUPATIONS)
    row += _one_hot(lead.get("source", "manual"), SOURCES)
    row += _one_hot(lead.get("creative_type", "unknown"), CREATIVE_TYPES)
    row += _one_hot(lead.get("ad_placement", "unknown"), AD_PLACEMENTS)
    return np.array(row, dtype=float).reshape(1, -1)
