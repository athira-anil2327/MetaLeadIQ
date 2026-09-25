"""
SQLite persistence layer (WAL mode for concurrent read/write safety under
webhook bursts). Plain sqlite3 is used with FastAPI's threadpool executing
sync route handlers, so no async driver is required for an MVP of this scale.
"""
import sqlite3
import json
from contextlib import contextmanager
from datetime import datetime, timezone

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    instagram_scoped_id TEXT,
    occupation TEXT,
    source TEXT,               -- facebook_lead_ad | whatsapp_inbound | instagram_inbound | manual
    creative_type TEXT,        -- video | image | carousel | unknown
    ad_placement TEXT,         -- feed | stories | reels | audience_network | unknown
    total_visits INTEGER DEFAULT 1,
    time_on_site_seconds INTEGER DEFAULT 0,
    cpc REAL DEFAULT 0.0,
    leadgen_id TEXT,
    base_score REAL,
    calibrated_probability REAL,
    ci_lower REAL,
    ci_upper REAL,
    confidence_level TEXT,
    contacted INTEGER DEFAULT 0,
    contacted_at TEXT,
    frozen_score REAL,
    submitted_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    channel TEXT NOT NULL,       -- whatsapp | instagram
    external_id TEXT NOT NULL,   -- wa phone number or ig-scoped id
    created_at TEXT NOT NULL,
    UNIQUE(channel, external_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    direction TEXT NOT NULL,     -- inbound | outbound
    channel TEXT NOT NULL,
    body TEXT,
    raw_payload TEXT,
    timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_ig ON leads(instagram_scoped_id);
CREATE INDEX IF NOT EXISTS idx_conv_lookup ON conversations(channel, external_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)


# ---------------------------------------------------------------- leads ----

def create_lead(data: dict) -> int:
    ts = now_iso()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO leads (
                full_name, email, phone, instagram_scoped_id, occupation,
                source, creative_type, ad_placement, total_visits,
                time_on_site_seconds, cpc, leadgen_id, submitted_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                data.get("full_name"), data.get("email"), data.get("phone"),
                data.get("instagram_scoped_id"), data.get("occupation"),
                data.get("source", "manual"), data.get("creative_type", "unknown"),
                data.get("ad_placement", "unknown"), data.get("total_visits", 1),
                data.get("time_on_site_seconds", 0), data.get("cpc", 0.0),
                data.get("leadgen_id"), ts, ts,
            ),
        )
        return cur.lastrowid


def update_lead_scores(lead_id: int, base_score: float, calibrated_probability: float,
                        ci_lower: float, ci_upper: float, confidence_level: str):
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE leads SET base_score=?, calibrated_probability=?, ci_lower=?,
                ci_upper=?, confidence_level=?, updated_at=?
            WHERE id=?
            """,
            (base_score, calibrated_probability, ci_lower, ci_upper,
             confidence_level, now_iso(), lead_id),
        )


def mark_contacted(lead_id: int, frozen_score: float):
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE leads SET contacted=1, contacted_at=?, frozen_score=?, updated_at=?
            WHERE id=?
            """,
            (now_iso(), frozen_score, now_iso(), lead_id),
        )


def get_lead(lead_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id=?", (lead_id,)).fetchone()
        return dict(row) if row else None


def find_lead_by_phone(phone: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM leads WHERE phone=?", (phone,)).fetchone()
        return dict(row) if row else None


def find_lead_by_instagram_id(ig_id: str):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM leads WHERE instagram_scoped_id=?", (ig_id,)
        ).fetchone()
        return dict(row) if row else None


def list_active_leads():
    """All leads not yet closed/contacted-and-stale; used for the priority queue."""
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM leads ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]


# --------------------------------------------------------- conversations ---

def get_or_create_conversation(lead_id: int, channel: str, external_id: str) -> int:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM conversations WHERE channel=? AND external_id=?",
            (channel, external_id),
        ).fetchone()
        if row:
            return row["id"]
        cur = conn.execute(
            "INSERT INTO conversations (lead_id, channel, external_id, created_at) VALUES (?,?,?,?)",
            (lead_id, channel, external_id, now_iso()),
        )
        return cur.lastrowid


def add_message(conversation_id: int, direction: str, channel: str, body: str, raw_payload: dict):
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO messages (conversation_id, direction, channel, body, raw_payload, timestamp)
            VALUES (?,?,?,?,?,?)
            """,
            (conversation_id, direction, channel, body, json.dumps(raw_payload or {}), now_iso()),
        )


def list_conversations():
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT c.id as conversation_id, c.channel, c.external_id, c.lead_id,
                   l.full_name, l.base_score, l.confidence_level,
                   (SELECT body FROM messages m WHERE m.conversation_id = c.id
                        ORDER BY m.id DESC LIMIT 1) AS last_message,
                   (SELECT timestamp FROM messages m WHERE m.conversation_id = c.id
                        ORDER BY m.id DESC LIMIT 1) AS last_message_at
            FROM conversations c
            JOIN leads l ON l.id = c.lead_id
            ORDER BY last_message_at DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]


def list_messages(conversation_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id=? ORDER BY id ASC",
            (conversation_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_conversation(conversation_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM conversations WHERE id=?", (conversation_id,)).fetchone()
        return dict(row) if row else None
