"""
Stage 6: strict lexicographic ordering over (decayed_score DESC, cpc ASC).
"""
from app.ml.decay import decayed_score, classify_status, sla_for_status


def build_priority_queue(leads: list[dict]) -> list[dict]:
    enriched = []
    for lead in leads:
        base = lead.get("base_score")
        if base is None:
            continue  # not yet scored
        score_now = decayed_score(
            base_score=base,
            submitted_at_iso=lead["submitted_at"],
            contacted=bool(lead.get("contacted")),
            frozen_score=lead.get("frozen_score"),
        )
        status = classify_status(score_now)
        enriched.append({
            **lead,
            "decayed_score": round(score_now, 2),
            "status": status,
            "sla": sla_for_status(status),
        })

    # Lexicographic: decayed_score DESC, then cpc ASC
    enriched.sort(key=lambda x: (-x["decayed_score"], x.get("cpc") or 0.0))
    for i, item in enumerate(enriched, start=1):
        item["rank"] = i
    return enriched
