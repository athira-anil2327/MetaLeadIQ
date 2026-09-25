from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import database as db
from app.ml.priority import build_priority_queue
from app.ml.decay import decayed_score

router = APIRouter(prefix="/api/leads", tags=["leads"])


class ManualLeadIn(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    occupation: str = "other"
    source: str = "manual"
    creative_type: str = "unknown"
    ad_placement: str = "unknown"
    total_visits: int = 1
    time_on_site_seconds: int = 0
    cpc: float = 0.0


@router.get("")
def get_priority_queue():
    leads = db.list_active_leads()
    return build_priority_queue(leads)


@router.get("/{lead_id}")
def get_lead(lead_id: int):
    lead = db.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.get("base_score") is not None:
        lead["decayed_score"] = round(
            decayed_score(
                lead["base_score"], lead["submitted_at"],
                contacted=bool(lead["contacted"]), frozen_score=lead.get("frozen_score"),
            ), 2
        )
    return lead


@router.post("/{lead_id}/contact")
def mark_contacted(lead_id: int):
    lead = db.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.get("base_score") is None:
        raise HTTPException(status_code=400, detail="Lead has not been scored yet")

    current = decayed_score(
        lead["base_score"], lead["submitted_at"],
        contacted=False, frozen_score=None,
    )
    db.mark_contacted(lead_id, round(current, 2))
    return db.get_lead(lead_id)


from app.ml.scoring import score_lead  # noqa: E402  (local import avoids load at module import time)
from app.ml.confidence import wald_interval  # noqa: E402


@router.post("")
def create_manual_lead(payload: ManualLeadIn):
    lead_id = db.create_lead(payload.model_dump())
    lead_row = db.get_lead(lead_id)
    result = score_lead(lead_row)
    lower, upper, level = wald_interval(result["calibrated_probability"], lead_row["total_visits"])
    db.update_lead_scores(
        lead_id, result["base_score"], result["calibrated_probability"], lower, upper, level
    )
    return db.get_lead(lead_id)
