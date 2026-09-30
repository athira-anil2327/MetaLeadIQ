"""
Meta Lead Ads integration.

Meta's webhook only ever sends a `leadgen_id` (never the actual form answers,
for privacy reasons):
{
  "entry": [{
    "changes": [{
      "field": "leadgen",
      "value": {"leadgen_id": "123", "page_id": "...", "form_id": "...",
                 "ad_id": "...", "created_time": 1234567890}
    }]
  }]
}

You must make an authenticated follow-up GET to the Graph API using your
Page Access Token to retrieve the submitted field data.
"""
import httpx

from app.config import settings

GRAPH_BASE = f"https://graph.facebook.com/{settings.GRAPH_API_VERSION}"


def extract_leadgen_ids(payload: dict) -> list[dict]:
    out = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") == "leadgen":
                out.append(change.get("value", {}))
    return out


async def fetch_lead_details(leadgen_id: str) -> dict:
    """Fetch the actual submitted form fields for a given leadgen_id."""
    if not settings.META_PAGE_ACCESS_TOKEN:
        raise RuntimeError(
            "META_PAGE_ACCESS_TOKEN not configured. Required to resolve "
            "leadgen_id -> actual form answers."
        )

    url = f"{GRAPH_BASE}/{leadgen_id}"
    params = {"access_token": settings.META_PAGE_ACCESS_TOKEN}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


def normalize_lead_fields(graph_response: dict) -> dict:
    """
    Graph API returns field_data as a list of {name, values: [...]}.
    Map known field names to our schema; unknown fields are ignored.
    """
    field_map = {}
    for fd in graph_response.get("field_data", []):
        name = fd.get("name", "").lower()
        values = fd.get("values", [])
        field_map[name] = values[0] if values else None

    return {
        "full_name": field_map.get("full_name") or field_map.get("name"),
        "email": field_map.get("email"),
        "phone": field_map.get("phone_number") or field_map.get("phone"),
        "occupation": field_map.get("occupation") or field_map.get("job_title") or "other",
        "leadgen_id": graph_response.get("id"),
        "ad_placement": "unknown",
        "creative_type": "unknown",
    }
