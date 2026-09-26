"""
Instagram Messaging integration (delivered via the Messenger Platform /
Graph API webhook, since Instagram DMs route through your connected
Facebook Page).

Inbound payload shape:
{
  "entry": [{
    "id": "<ig-business-account-id>",
    "messaging": [{
      "sender": {"id": "<ig-scoped-user-id>"},
      "recipient": {"id": "<ig-business-account-id>"},
      "timestamp": 1234567890,
      "message": {"mid": "...", "text": "Hey, saw your ad!"}
    }]
  }]
}

Outbound: POST to
https://graph.facebook.com/{version}/me/messages?access_token=...
"""
import httpx

from app.config import settings

GRAPH_BASE = f"https://graph.facebook.com/{settings.GRAPH_API_VERSION}"


def parse_inbound(payload: dict) -> list[dict]:
    """Extract normalized inbound DMs: [{ig_scoped_id, text, mid}]."""
    results = []
    for entry in payload.get("entry", []):
        for event in entry.get("messaging", []):
            message = event.get("message")
            if not message or message.get("is_echo"):
                continue  # skip echoes of our own outbound sends
            results.append({
                "ig_scoped_id": event.get("sender", {}).get("id"),
                "text": message.get("text", ""),
                "mid": message.get("mid"),
            })
    return results


async def send_text_message(recipient_ig_scoped_id: str, body: str) -> dict:
    if not settings.INSTAGRAM_PAGE_ACCESS_TOKEN:
        raise RuntimeError(
            "Instagram credentials not configured. Set INSTAGRAM_PAGE_ACCESS_TOKEN "
            "in .env once your Meta app is approved for instagram_manage_messages."
        )

    url = f"{GRAPH_BASE}/me/messages"
    params = {"access_token": settings.INSTAGRAM_PAGE_ACCESS_TOKEN}
    payload = {
        "recipient": {"id": recipient_ig_scoped_id},
        "message": {"text": body},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, params=params, json=payload)
        resp.raise_for_status()
        return resp.json()
