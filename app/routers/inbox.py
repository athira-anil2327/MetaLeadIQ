from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import database as db
from app.integrations import whatsapp, instagram

router = APIRouter(prefix="/api/inbox", tags=["inbox"])


class ReplyIn(BaseModel):
    body: str


@router.get("")
def list_conversations():
    return db.list_conversations()


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: int):
    conv = db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": conv, "messages": db.list_messages(conversation_id)}


@router.post("/{conversation_id}/reply")
async def send_reply(conversation_id: int, payload: ReplyIn):
    conv = db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["channel"] == "whatsapp":
        await whatsapp.send_text_message(conv["external_id"], payload.body)
    elif conv["channel"] == "instagram":
        await instagram.send_text_message(conv["external_id"], payload.body)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown channel {conv['channel']}")

    db.add_message(conversation_id, "outbound", conv["channel"], payload.body, {})
    return {"status": "sent"}
