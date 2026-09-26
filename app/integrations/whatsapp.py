"""
WhatsApp Cloud API integration.

Inbound: Meta POSTs message events to /api/webhook/whatsapp. Payload shape:
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{"from": "919999999999", "id": "...", "timestamp": "...",
                       "type": "text", "text": {"body": "Hi, is this open?"}}],
        "contacts": [{"profile": {"name": "Sophia Martinez"}, "wa_id": "919999999999"}]
      }
    }]
  }]
}

Outbound: POST to
https://graph.facebook.com/{version}/{phone_number_id}/messages
"""
import httpx

from app.config import settings

GRAPH_BASE = f"https://graph.facebook.com/{settings.GRAPH_API_VERSION}"


def parse_inbound(payload: dict) -> list[dict]:
    """Extract normalized inbound messages: [{wa_id, name, text, wa_message_id}]."""
    results = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])
            if not messages:
                continue  # could be a status/read-receipt update; ignore

            contacts = {c["wa_id"]: c.get("profile", {}).get("name")
                        for c in value.get("contacts", [])}

            for msg in messages:
                wa_id = msg.get("from")
                text = ""
                if msg.get("type") == "text":
                    text = msg.get("text", {}).get("body", "")
                else:
                    text = f"[unsupported message type: {msg.get('type')}]"

                results.append({
                    "wa_id": wa_id,
                    "name": contacts.get(wa_id),
                    "text": text,
                    "wa_message_id": msg.get("id"),
                })
    return results


async def send_text_message(to_wa_id: str, body: str) -> dict:
    if not settings.WHATSAPP_ACCESS_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        raise RuntimeError(
            "WhatsApp credentials not configured. Set WHATSAPP_ACCESS_TOKEN and "
            "WHATSAPP_PHONE_NUMBER_ID in .env once your Meta app is approved."
        )

    url = f"{GRAPH_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to_wa_id,
        "type": "text",
        "text": {"body": body},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()
