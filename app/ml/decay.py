"""
Stage 4: dS/dt = -lambda*S  =>  S(t) = S0 * e^(-lambda * delta_t_hours)
lambda = ln(2) / half_life_hours
"""
import math
from datetime import datetime, timezone

from app.config import settings

LAMBDA = math.log(2) / settings.HALF_LIFE_HOURS


def decayed_score(base_score: float, submitted_at_iso: str,
                   contacted: bool = False, frozen_score: float | None = None,
                   now: datetime | None = None) -> float:
    if contacted and frozen_score is not None:
        return frozen_score

    now = now or datetime.now(timezone.utc)
    submitted_at = datetime.fromisoformat(submitted_at_iso)
    if submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)

    delta_hours = max(0.0, (now - submitted_at).total_seconds() / 3600.0)
    return base_score * math.exp(-LAMBDA * delta_hours)


def classify_status(score: float) -> str:
    if score >= settings.HOT_THRESHOLD:
        return "hot"
    if score >= settings.WARM_THRESHOLD:
        return "warm"
    return "cold"


def sla_for_status(status: str) -> str:
    return {
        "hot": "Respond within 15 minutes",
        "warm": "Schedule follow-up within 24 hours",
        "cold": "Enroll in automated nurture sequence",
    }.get(status, "")
