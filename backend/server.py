"""
MetaLeadIQ Production FastAPI Server
Provides real-time scoring, Meta Lead Ads webhook integration,
lead lifecycle management, and dashboard statistics.
"""
import logging
import os
import sys
from typing import Optional, List
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, HTTPException, Query, Request, Response, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import backend.database as db
import backend.inference as inf
from backend.seeder import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('server')

app = FastAPI(
    title="MetaLeadIQ API",
    description="Real-time Lead Scoring & Priority Queue Engine for Meta Advertising Campaigns",
    version="2.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Ensure database is initialized and seeded on startup."""
    db.init_db()
    inf.load_artifacts()
    seed_database(force=False)
    logger.info("MetaLeadIQ Server started successfully.")


# -------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------

class LeadCreateRequest(BaseModel):
    name: str = Field(..., example="Sophia Taylor")
    email: Optional[str] = Field("", example="sophia.t@example.com")
    phone: Optional[str] = Field("", example="+1 (555) 234-5678")
    lead_source: Optional[str] = Field("Google", example="Google")
    lead_origin: Optional[str] = Field("Lead Add Form", example="Lead Add Form")
    placement: Optional[str] = Field("Reels", example="Reels")
    audience_type: Optional[str] = Field("Broad", example="Broad")
    creative_type: Optional[str] = Field("Video", example="Video")
    occupation: Optional[str] = Field("Working Professional", example="Working Professional")
    last_activity: Optional[str] = Field("SMS Sent", example="SMS Sent")
    total_visits: Optional[int] = Field(1, example=3)
    time_on_website: Optional[float] = Field(0.0, example=8.5)
    page_views: Optional[int] = Field(1, example=3)
    cpc: Optional[float] = Field(1.50, example=1.50)
    ctr: Optional[float] = Field(2.5, example=2.5)


class LeadResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    leadSource: str
    leadOrigin: str
    placement: str
    audienceType: str
    ctr: float
    cpc: float
    creativeType: str
    totalVisits: int
    timeOnWebsite: float
    pageViews: int
    lastActivity: str
    baseScore: int
    currentScore: int
    conversionProbability: int
    hoursUncontacted: float
    status: str
    confidence: str
    predictionLower: int
    predictionUpper: int
    submissionTime: str
    contacted: bool


def format_lead_for_ui(row: dict) -> dict:
    """Format DB row (snake_case) into frontend schema (camelCase)."""
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row.get("email") or "",
        "phone": row.get("phone") or "",
        "leadSource": row.get("lead_source") or "Unknown",
        "leadOrigin": row.get("lead_origin") or "Unknown",
        "placement": row.get("placement") or "Feed",
        "audienceType": row.get("audience_type") or "Broad",
        "ctr": float(row.get("ctr") or 0.0),
        "cpc": float(row.get("cpc") or 0.0),
        "creativeType": row.get("creative_type") or "Video",
        "totalVisits": int(row.get("total_visits") or 1),
        "timeOnWebsite": float(row.get("time_on_website") or 0.0),
        "pageViews": int(row.get("page_views") or 1),
        "lastActivity": row.get("last_activity") or "Unknown",
        "baseScore": int(row.get("base_score") or 50),
        "currentScore": int(row.get("decayed_score") or 50),
        "conversionProbability": int(round((row.get("calibrated_probability") or 0.5) * 100)),
        "hoursUncontacted": float(row.get("hours_uncontacted") or 0.0),
        "status": row.get("status") or "Warm",
        "confidence": row.get("confidence") or "Uncertain",
        "predictionLower": int(row.get("prediction_lower") or 40),
        "predictionUpper": int(row.get("prediction_upper") or 60),
        "submissionTime": row.get("submission_time") or row.get("created_at") or "",
        "contacted": bool(row.get("contacted")),
    }


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "MetaLeadIQ API",
        "version": "2.0.0",
        "status": "online",
        "total_leads": db.get_lead_count(),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/stats")
def get_dashboard_stats():
    """Get aggregate metrics for the dashboard KPI cards."""
    return db.get_stats()


@app.get("/api/leads")
def list_leads(
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, regex="^(Hot|Warm|Cold)$"),
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("decayed_score"),
    sort_dir: Optional[str] = Query("DESC")
):
    """Retrieve leads with search, filter, and pagination support."""
    rows = db.get_all_leads(
        limit=limit,
        offset=offset,
        status_filter=status,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    return [format_lead_for_ui(r) for r in rows]


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str):
    """Retrieve details of a single lead."""
    lead = db.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return format_lead_for_ui(lead)


@app.post("/api/leads")
def create_lead(payload: LeadCreateRequest):
    """
    Manually create a new lead.
    Immediately runs the trained XGBoost model and Platt calibration,
    computes time decay and confidence intervals, and persists to DB.
    """
    lead_dict = inf.score_lead(payload.dict())
    db.insert_lead(lead_dict)
    logger.info(f"Created new lead {lead_dict['id']} - Status: {lead_dict['status']} (Score: {lead_dict['decayed_score']})")
    return format_lead_for_ui(lead_dict)


@app.post("/api/leads/{lead_id}/contact")
def mark_lead_contacted(lead_id: str):
    """Mark lead as contacted. Freezes score decay."""
    lead = db.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.mark_contacted(lead_id)
    updated = db.get_lead_by_id(lead_id)
    return format_lead_for_ui(updated)


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: str):
    """Delete a lead."""
    lead = db.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete_lead(lead_id)
    return {"status": "deleted", "id": lead_id}


# -------------------------------------------------------------
# Meta Lead Ads Webhook Integration
# -------------------------------------------------------------

META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "metaleadiq_secret_token_2026")


@app.get("/api/webhook/meta")
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """
    Meta Webhook Verification Challenge.
    When configuring the webhook in the Meta App Dashboard,
    Meta sends a GET request to verify token authenticity.
    """
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        logger.info("Meta webhook verification challenge passed.")
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@app.post("/api/webhook/meta")
async def receive_meta_lead_webhook(request: Request):
    """
    Real-Time Meta Lead Ads Webhook Receiver.
    Accepts incoming leads directly from Facebook / Instagram Lead Forms,
    scores them with XGBoost in real-time, and inserts them into the priority queue.
    """
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Received webhook payload: {body}")

    # Handle standard Meta Leadgen Graph API webhook format
    if "entry" in body and isinstance(body["entry"], list):
        created_leads = []
        for entry in body["entry"]:
            for change in entry.get("changes", []):
                if change.get("field") == "leadgen":
                    leadgen_val = change.get("value", {})
                    field_data = leadgen_val.get("field_data", [])

                    # Parse field_data key-value list from Meta
                    extracted = {}
                    for field in field_data:
                        name = field.get("name")
                        values = field.get("values", [])
                        if values:
                            extracted[name] = values[0]

                    lead_input = {
                        "name": extracted.get("full_name", extracted.get("name", "Meta Lead")),
                        "email": extracted.get("email", ""),
                        "phone": extracted.get("phone_number", extracted.get("phone", "")),
                        "lead_source": "Instagram" if "instagram" in leadgen_val.get("form_id", "").lower() else "Facebook",
                        "lead_origin": "Lead Add Form",
                        "placement": "Reels",
                        "occupation": extracted.get("occupation", "Working Professional"),
                        "last_activity": "Form Submitted on Website",
                        "total_visits": 2,
                        "time_on_website": 4.5,
                        "page_views": 2,
                    }
                    scored = inf.score_lead(lead_input)
                    db.insert_lead(scored)
                    created_leads.append(format_lead_for_ui(scored))

        return {"status": "success", "processed_count": len(created_leads), "leads": created_leads}

    # Handle direct flat JSON payload (custom ad integrations or test payloads)
    scored = inf.score_lead(body)
    db.insert_lead(scored)
    return {
        "status": "success",
        "lead": format_lead_for_ui(scored)
    }


@app.post("/api/seed")
def reseed():
    """Reseeds the database from pipeline export."""
    count = seed_database(force=True)
    return {"status": "reseeded", "count": count}


# -------------------------------------------------------------
# WhatsApp Webhooks
# -------------------------------------------------------------

@app.get("/api/webhook/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@app.post("/api/webhook/whatsapp")
async def receive_whatsapp_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Ingest message and lead
    lead_name = "WhatsApp Prospect"
    wa_id = "+1 (555) 999-0000"
    message_text = "Inbound message"

    if "entry" in body and isinstance(body["entry"], list):
        for entry in body["entry"]:
            for change in entry.get("changes", []):
                val = change.get("value", {})
                contacts = val.get("contacts", [])
                if contacts:
                    lead_name = contacts[0].get("profile", {}).get("name", lead_name)
                    wa_id = contacts[0].get("wa_id", wa_id)
                msgs = val.get("messages", [])
                if msgs:
                    message_text = msgs[0].get("text", {}).get("body", message_text)

    lead_input = {
        "name": lead_name,
        "phone": wa_id,
        "lead_source": "WhatsApp",
        "lead_origin": "Inbound Message",
        "placement": "Direct Message",
        "total_visits": 3,
        "time_on_website": 4.0,
        "page_views": 2,
    }
    scored = inf.score_lead(lead_input)
    db.insert_lead(scored)

    conv_id = db.get_or_create_conversation(scored["id"], "whatsapp", wa_id)
    db.add_message(conv_id, "inbound", "whatsapp", message_text)

    return {"status": "ok", "lead_id": scored["id"], "conversation_id": conv_id}


# -------------------------------------------------------------
# Instagram Webhooks
# -------------------------------------------------------------

@app.get("/api/webhook/instagram")
def verify_instagram_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@app.post("/api/webhook/instagram")
async def receive_instagram_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    ig_id = body.get("sender_id", "@instagram_user")
    msg_body = body.get("text", "Interested in your offer.")

    lead_input = {
        "name": f"IG Lead ({ig_id})",
        "lead_source": "Instagram",
        "lead_origin": "Direct Message",
        "placement": "Reels",
        "total_visits": 2,
        "time_on_website": 3.0,
        "page_views": 2,
    }
    scored = inf.score_lead(lead_input)
    db.insert_lead(scored)

    conv_id = db.get_or_create_conversation(scored["id"], "instagram", ig_id)
    db.add_message(conv_id, "inbound", "instagram", msg_body)

    return {"status": "ok", "lead_id": scored["id"], "conversation_id": conv_id}


# -------------------------------------------------------------
# Unified Inbox Endpoints
# -------------------------------------------------------------

class ReplyPayload(BaseModel):
    body: str


@app.get("/api/inbox")
def list_conversations():
    return db.list_conversations()


@app.get("/api/inbox/{conv_id}/messages")
def get_messages(conv_id: int):
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": conv, "messages": db.list_messages(conv_id)}


@app.post("/api/inbox/{conv_id}/reply")
def reply_conversation(conv_id: int, payload: ReplyPayload):
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.add_message(conv_id, "outbound", conv["channel"], payload.body)
    return {"status": "sent"}


# -------------------------------------------------------------
# Dataset Upload (CSV)
# -------------------------------------------------------------

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and score a CSV file of leads."""
    import csv
    import io
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))

    count = 0
    for row in reader:
        lead_input = {
            "name": row.get("full_name") or row.get("name") or "Imported Lead",
            "email": row.get("email", ""),
            "phone": row.get("phone", ""),
            "lead_source": row.get("lead_source", "CSV Import"),
            "placement": row.get("placement", "Feed"),
            "occupation": row.get("occupation", "Working Professional"),
            "creative_type": row.get("creative_type", "Image"),
            "total_visits": int(row.get("total_visits") or 2),
            "time_on_website": float(row.get("time_on_website") or (int(row.get("time_on_site_seconds") or 180) / 60)),
            "cpc": float(row.get("cpc") or 1.25),
            "ctr": float(row.get("ctr") or 2.5),
        }
        scored = inf.score_lead(lead_input)
        db.insert_lead(scored)
        count += 1

    return {"status": "success", "imported_count": count}

