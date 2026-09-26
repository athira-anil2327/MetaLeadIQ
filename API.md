# 📡 MetaLeadIQ API Documentation

The MetaLeadIQ server runs on FastAPI and provides a high-throughput, low-latency REST and webhook interface for lead ingestion, real-time ML scoring, and queue retrieval.

**Base URL**: `http://localhost:8000`

---

## 1. Health & Statistics

### `GET /`
Returns service status, version, and total indexed lead count.

**Response (200 OK):**
```json
{
  "name": "MetaLeadIQ API",
  "version": "2.0.0",
  "status": "online",
  "total_leads": 151,
  "timestamp": "2026-09-03T00:32:26.541239"
}
```

---

### `GET /api/stats`
Retrieves aggregate metrics for KPI cards.

**Response (200 OK):**
```json
{
  "total_leads": 151,
  "hot_leads": 151,
  "warm_leads": 0,
  "cold_leads": 0,
  "contacted": 12,
  "uncontacted": 139,
  "avg_score": 94.1,
  "avg_hours_uncontacted": 1.4,
  "contact_rate": 7.9
}
```

---

## 2. Lead Management

### `GET /api/leads`
Queries leads with filtering, search, sorting, and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `500` | Max records to return (1-1000) |
| `offset` | integer | `0` | Offset index for pagination |
| `status` | string | `null` | Filter by `Hot`, `Warm`, or `Cold` |
| `search` | string | `null` | Search query matching name, email, phone, or source |
| `sort_by` | string | `decayed_score` | Column to sort on (`decayed_score`, `base_score`, `cpc`, etc.) |
| `sort_dir` | string | `DESC` | Sort direction (`ASC` or `DESC`) |

**Response (200 OK):**
```json
[
  {
    "id": "L-1000",
    "name": "Liam Smith",
    "email": "liam.smith0@example.com",
    "phone": "+1 (555) 180-7964",
    "leadSource": "Google",
    "leadOrigin": "API",
    "placement": "Feed",
    "audienceType": "Broad",
    "ctr": 2.6,
    "cpc": 0.53,
    "creativeType": "Image",
    "totalVisits": 6,
    "timeOnWebsite": 16.9,
    "pageViews": 3,
    "lastActivity": "Olark Chat Conversation",
    "baseScore": 100,
    "currentScore": 100,
    "conversionProbability": 93,
    "hoursUncontacted": 0.1,
    "status": "Hot",
    "confidence": "High",
    "predictionLower": 88,
    "predictionUpper": 98,
    "submissionTime": "2026-09-02T23:40:41.464678",
    "contacted": false
  }
]
```

---

### `POST /api/leads`
Manually create and instantly score a new lead using the XGBoost model.

**Request Body:**
```json
{
  "name": "Alex Johnson",
  "email": "alex.j@enterprise.io",
  "phone": "+1 (555) 345-6789",
  "lead_source": "Google",
  "lead_origin": "Lead Add Form",
  "placement": "Reels",
  "audience_type": "Broad",
  "occupation": "Working Professional",
  "last_activity": "SMS Sent",
  "total_visits": 4,
  "time_on_website": 12.5,
  "page_views": 3
}
```

**Response (200 OK):**
```json
{
  "id": "L-34192",
  "name": "Alex Johnson",
  "email": "alex.j@enterprise.io",
  "phone": "+1 (555) 345-6789",
  "leadSource": "Google",
  "leadOrigin": "Lead Add Form",
  "placement": "Reels",
  "audienceType": "Broad",
  "ctr": 2.8,
  "cpc": 1.45,
  "creativeType": "Video",
  "totalVisits": 4,
  "timeOnWebsite": 12.5,
  "pageViews": 3,
  "lastActivity": "SMS Sent",
  "baseScore": 100,
  "currentScore": 100,
  "conversionProbability": 96,
  "hoursUncontacted": 0.0,
  "status": "Hot",
  "confidence": "Moderate",
  "predictionLower": 89,
  "predictionUpper": 100,
  "submissionTime": "2026-09-03T00:34:12.194821",
  "contacted": false
}
```

---

### `POST /api/leads/{id}/contact`
Marks a lead as contacted, records the timestamp, and freezes further score decay.

**Response (200 OK):**
```json
{
  "id": "L-1000",
  "contacted": true
}
```

---

## 3. Meta Lead Ads Webhook Integration

### `GET /api/webhook/meta`
Meta Webhook Handshake Verification. When setting up a webhook subscription in the Meta Developer Portal, Meta sends a GET verification challenge.

**Query Parameters:**
- `hub.mode`: `"subscribe"`
- `hub.verify_token`: `"metaleadiq_secret_token_2026"`
- `hub.challenge`: random challenge string

---

### `POST /api/webhook/meta`
Real-Time Webhook Listener. Supports two payload formats:

#### A. Standard Meta Graph API Format
```json
{
  "object": "page",
  "entry": [
    {
      "id": "10492837482",
      "time": 1725324800,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "ad_id": "92837462",
            "form_id": "Instagram_Lead_Form_1",
            "leadgen_id": "48291048291",
            "created_time": 1725324800,
            "field_data": [
              { "name": "full_name", "values": ["Rachel Green"] },
              { "name": "email", "values": ["rachel@ralphlauren.com"] },
              { "name": "phone_number", "values": ["+15559876543"] },
              { "name": "occupation", "values": ["Working Professional"] }
            ]
          }
        }
      ]
    }
  ]
}
```

#### B. Direct / Custom Ad Payload
```json
{
  "name": "Marcus Wright",
  "email": "marcus@resistance.org",
  "phone": "+1 (555) 777-8888",
  "lead_source": "Instagram",
  "placement": "Stories",
  "total_visits": 3,
  "time_on_website": 8.0
}
```
