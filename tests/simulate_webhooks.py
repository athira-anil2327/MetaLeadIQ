"""
Simulates inbound webhook traffic so you can see the whole pipeline work
end-to-end (scoring, decay, unified inbox) before your Meta app is approved.

Usage (with the server already running on localhost:8000):
    python tests/simulate_webhooks.py
"""
import httpx

BASE = "http://localhost:8000"

WHATSAPP_PAYLOAD = {
    "entry": [{
        "changes": [{
            "value": {
                "contacts": [{"profile": {"name": "Sophia Martinez"}, "wa_id": "15551234567"}],
                "messages": [{
                    "from": "15551234567",
                    "id": "wamid.demo1",
                    "timestamp": "1234567890",
                    "type": "text",
                    "text": {"body": "Hi! Is the AI Engineering Bootcamp still open for enrollment?"}
                }]
            }
        }]
    }]
}

INSTAGRAM_PAYLOAD = {
    "entry": [{
        "id": "179999999999999",
        "messaging": [{
            "sender": {"id": "ig_scoped_12345"},
            "recipient": {"id": "179999999999999"},
            "timestamp": 1234567890,
            "message": {"mid": "ig_mid_demo1", "text": "Saw your Reels ad, how much is the course?"}
        }]
    }]
}


def main():
    print("Sending simulated WhatsApp message...")
    r = httpx.post(f"{BASE}/api/webhook/whatsapp", json=WHATSAPP_PAYLOAD)
    print(r.status_code, r.json())

    print("\nSending simulated Instagram DM...")
    r = httpx.post(f"{BASE}/api/webhook/instagram", json=INSTAGRAM_PAYLOAD)
    print(r.status_code, r.json())

    print("\nFetching priority queue...")
    r = httpx.get(f"{BASE}/api/leads")
    for lead in r.json():
        print(f"  #{lead['rank']} {lead.get('full_name') or lead.get('phone') or lead.get('instagram_scoped_id')} "
              f"— score {lead['decayed_score']} ({lead['status']})")

    print("\nFetching unified inbox...")
    r = httpx.get(f"{BASE}/api/inbox")
    for conv in r.json():
        print(f"  [{conv['channel']}] {conv.get('full_name') or conv['external_id']}: {conv['last_message']}")

    print("\nOpen http://localhost:8000 to see the dashboard.")


if __name__ == "__main__":
    main()
