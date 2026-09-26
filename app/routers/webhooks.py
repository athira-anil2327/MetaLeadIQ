import logging

from fastapi import APIRouter, Request, Query, HTTPException, Response

from app.config import settings
from app.security import verify_signature
from app import database as db
from app.ml.scoring import score_lead
from app.ml.confidence import wald_interval
from app.integrations import whatsapp, instagram, meta_leads

logger = logging.getLogger("metaleadiq.webhooks")
router = APIRouter(prefix="/api/webhook", tags=["webhooks"])


def _verify_challenge(mode: str | None, token: str | None, challenge: str | None):
    if mode == "subscribe" and token == settings.META_WEBHOOK_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Webhook verification failed")


def _score_and_store(lead_id: int, lead_row: dict):
    result = score_lead(lead_row)
    lower, upper, level = wald_interval(
        result["calibrated_probability"], lead_row.get("total_visits", 1)
    )
    db.update_lead_scores(
        lead_id, result["base_score"], result["calibrated_probability"],
        lower, upper, level,
    )


# ------------------------------------------------------------- Meta Lead Ads

@router.get("/meta")
def verify_meta(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    return _verify_challenge(hub_mode, hub_verify_token, hub_challenge)


@router.post("/meta")
async def receive_meta_lead(request: Request):
    raw = await request.body()
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    leadgen_events = meta_leads.extract_leadgen_ids(payload)

    created_ids = []
    for event in leadgen_events:
        leadgen_id = event.get("leadgen_id")
        try:
            details = await meta_leads.fetch_lead_details(leadgen_id)
            lead_data = meta_leads.normalize_lead_fields(details)
        except RuntimeError:
            # No page token configured yet (pre-approval / local dev) — store
            # the bare event so nothing is lost, scoring runs once fields exist.
            logger.warning("META_PAGE_ACCESS_TOKEN missing; storing leadgen_id only")
            lead_data = {"leadgen_id": leadgen_id, "occupation": "other"}

        lead_data["source"] = "facebook_lead_ad"
        lead_id = db.create_lead(lead_data)
        lead_row = db.get_lead(lead_id)
        try:
            _score_and_store(lead_id, lead_row)
        except FileNotFoundError as e:
            logger.error(str(e))
        created_ids.append(lead_id)

    return {"status": "ok", "leads_created": created_ids}


# ------------------------------------------------------------------ WhatsApp

@router.get("/whatsapp")
def verify_whatsapp(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    return _verify_challenge(hub_mode, hub_verify_token, hub_challenge)


@router.post("/whatsapp")
async def receive_whatsapp_message(request: Request):
    raw = await request.body()
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    inbound_messages = whatsapp.parse_inbound(payload)

    for msg in inbound_messages:
        lead = db.find_lead_by_phone(msg["wa_id"])
        if lead is None:
            lead_id = db.create_lead({
                "full_name": msg.get("name"),
                "phone": msg["wa_id"],
                "source": "whatsapp_inbound",
                "occupation": "other",
                "total_visits": 1,
                "time_on_site_seconds": 0,
            })
            lead = db.get_lead(lead_id)
            try:
                _score_and_store(lead_id, lead)
                lead = db.get_lead(lead_id)
            except FileNotFoundError as e:
                logger.error(str(e))

        conversation_id = db.get_or_create_conversation(lead["id"], "whatsapp", msg["wa_id"])
        db.add_message(conversation_id, "inbound", "whatsapp", msg["text"], payload)

    return {"status": "ok", "messages_received": len(inbound_messages)}


# ---------------------------------------------------------------- Instagram

@router.get("/instagram")
def verify_instagram(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    return _verify_challenge(hub_mode, hub_verify_token, hub_challenge)


@router.post("/instagram")
async def receive_instagram_message(request: Request):
    raw = await request.body()
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    inbound_dms = instagram.parse_inbound(payload)

    for dm in inbound_dms:
        lead = db.find_lead_by_instagram_id(dm["ig_scoped_id"])
        if lead is None:
            lead_id = db.create_lead({
                "instagram_scoped_id": dm["ig_scoped_id"],
                "source": "instagram_inbound",
                "occupation": "other",
                "total_visits": 1,
                "time_on_site_seconds": 0,
            })
            lead = db.get_lead(lead_id)
            try:
                _score_and_store(lead_id, lead)
                lead = db.get_lead(lead_id)
            except FileNotFoundError as e:
                logger.error(str(e))

        conversation_id = db.get_or_create_conversation(
            lead["id"], "instagram", dm["ig_scoped_id"]
        )
        db.add_message(conversation_id, "inbound", "instagram", dm["text"], payload)

    return {"status": "ok", "messages_received": len(inbound_dms)}
