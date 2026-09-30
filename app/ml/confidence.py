"""
Stage 5: asymptotic Wald confidence interval on the calibrated probability,
treating behavioral sample depth as n = 30 (prior pseudo-observations) +
total_visits (observed behavioral signal).
"""
import math

from app.config import settings


def wald_interval(p: float, total_visits: int):
    n = settings.WALD_N_BASE + max(0, total_visits)
    p = min(max(p, 1e-6), 1 - 1e-6)
    se = math.sqrt(p * (1 - p) / n)
    margin = settings.WALD_Z * se

    lower = max(0.0, round((p - margin) * 100, 1))
    upper = min(100.0, round((p + margin) * 100, 1))
    margin_pct = margin * 100

    if margin_pct <= 5.0:
        level = "high"
    elif margin_pct <= 12.0:
        level = "moderate"
    else:
        level = "uncertain"

    return lower, upper, level
