"""
MetaLeadIQ Database Layer
SQLite-backed persistence for leads, with full CRUD operations.
"""
import logging
import os
import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'metaleadiq.db')


def get_db_path():
    return DB_PATH


@contextmanager
def get_connection():
    """Thread-safe database connection context manager."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent reads
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Creates the leads table if it doesn't exist."""
    os.makedirs(os.path.dirname(get_db_path()), exist_ok=True)

    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                lead_source TEXT DEFAULT 'Direct',
                lead_origin TEXT DEFAULT 'Unknown',
                placement TEXT DEFAULT 'Feed',
                audience_type TEXT DEFAULT 'Broad',
                ctr REAL DEFAULT 0.0,
                cpc REAL DEFAULT 0.0,
                creative_type TEXT DEFAULT 'Image',
                total_visits INTEGER DEFAULT 1,
                time_on_website REAL DEFAULT 0.0,
                page_views INTEGER DEFAULT 1,
                last_activity TEXT DEFAULT 'Page Visited',
                base_score INTEGER DEFAULT 50,
                base_probability REAL DEFAULT 0.5,
                calibrated_probability REAL DEFAULT 0.5,
                decayed_score INTEGER DEFAULT 50,
                hours_uncontacted REAL DEFAULT 0.0,
                status TEXT DEFAULT 'Warm',
                confidence TEXT DEFAULT 'Uncertain',
                prediction_lower INTEGER DEFAULT 40,
                prediction_upper INTEGER DEFAULT 60,
                submission_time TEXT,
                contacted INTEGER DEFAULT 0,
                contacted_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id TEXT NOT NULL,
                channel TEXT NOT NULL,
                external_id TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(channel, external_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL REFERENCES conversations(id),
                direction TEXT NOT NULL,
                channel TEXT NOT NULL,
                body TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_leads_score
            ON leads(decayed_score DESC, cpc ASC)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_leads_status
            ON leads(status)
        """)
    logger.info(f"Database initialized at {get_db_path()}")


def insert_lead(lead: dict):
    """Insert a single lead into the database."""
    cols = [
        'id', 'name', 'email', 'phone', 'lead_source', 'lead_origin',
        'placement', 'audience_type', 'ctr', 'cpc', 'creative_type',
        'total_visits', 'time_on_website', 'page_views', 'last_activity',
        'base_score', 'base_probability', 'calibrated_probability',
        'decayed_score', 'hours_uncontacted', 'status', 'confidence',
        'prediction_lower', 'prediction_upper', 'submission_time',
        'contacted', 'contacted_at', 'created_at'
    ]
    values = [lead.get(col) for col in cols]
    placeholders = ', '.join(['?' for _ in cols])
    col_names = ', '.join(cols)

    with get_connection() as conn:
        conn.execute(
            f"INSERT OR REPLACE INTO leads ({col_names}) VALUES ({placeholders})",
            values
        )


def bulk_insert_leads(leads: list):
    """Insert multiple leads in a single transaction."""
    if not leads:
        return

    cols = [
        'id', 'name', 'email', 'phone', 'lead_source', 'lead_origin',
        'placement', 'audience_type', 'ctr', 'cpc', 'creative_type',
        'total_visits', 'time_on_website', 'page_views', 'last_activity',
        'base_score', 'base_probability', 'calibrated_probability',
        'decayed_score', 'hours_uncontacted', 'status', 'confidence',
        'prediction_lower', 'prediction_upper', 'submission_time',
        'contacted', 'contacted_at', 'created_at'
    ]
    placeholders = ', '.join(['?' for _ in cols])
    col_names = ', '.join(cols)

    with get_connection() as conn:
        conn.executemany(
            f"INSERT OR REPLACE INTO leads ({col_names}) VALUES ({placeholders})",
            [[lead.get(col) for col in cols] for lead in leads]
        )
    logger.info(f"Bulk inserted {len(leads)} leads into database.")


def get_all_leads(limit: int = 500, offset: int = 0,
                  status_filter: str = None,
                  search: str = None,
                  sort_by: str = 'decayed_score',
                  sort_dir: str = 'DESC') -> list:
    """Fetch leads with optional filtering, sorting, and pagination."""
    query = "SELECT * FROM leads WHERE 1=1"
    params = []

    if status_filter and status_filter in ('Hot', 'Warm', 'Cold'):
        query += " AND status = ?"
        params.append(status_filter)

    if search:
        query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR lead_source LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term] * 4)

    # Validate sort column to prevent SQL injection
    valid_sorts = ['decayed_score', 'base_score', 'cpc', 'hours_uncontacted',
                   'submission_time', 'name', 'status']
    if sort_by not in valid_sorts:
        sort_by = 'decayed_score'
    if sort_dir not in ('ASC', 'DESC'):
        sort_dir = 'DESC'

    query += f" ORDER BY {sort_by} {sort_dir}"
    if sort_by == 'decayed_score':
        query += ", cpc ASC"  # Tie-break by CPC

    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def get_lead_by_id(lead_id: str) -> dict:
    """Fetch a single lead by ID."""
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        return dict(row) if row else None


def update_lead(lead_id: str, updates: dict):
    """Update specific fields of a lead."""
    if not updates:
        return

    set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [lead_id]

    with get_connection() as conn:
        conn.execute(f"UPDATE leads SET {set_clause} WHERE id = ?", values)


def mark_contacted(lead_id: str):
    """Mark a lead as contacted and freeze its score."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE leads SET contacted = 1, contacted_at = ?, hours_uncontacted = 0 WHERE id = ?",
            (datetime.now().isoformat(), lead_id)
        )
    logger.info(f"Lead {lead_id} marked as contacted.")


def get_stats() -> dict:
    """Get aggregate dashboard statistics."""
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        hot = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'Hot'").fetchone()[0]
        warm = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'Warm'").fetchone()[0]
        cold = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'Cold'").fetchone()[0]
        contacted = conn.execute("SELECT COUNT(*) FROM leads WHERE contacted = 1").fetchone()[0]

        avg_score = conn.execute("SELECT AVG(decayed_score) FROM leads").fetchone()[0] or 0
        avg_hours = conn.execute("SELECT AVG(hours_uncontacted) FROM leads WHERE contacted = 0").fetchone()[0] or 0

        return {
            'total_leads': total,
            'hot_leads': hot,
            'warm_leads': warm,
            'cold_leads': cold,
            'contacted': contacted,
            'uncontacted': total - contacted,
            'avg_score': round(avg_score, 1),
            'avg_hours_uncontacted': round(avg_hours, 1),
            'contact_rate': round((contacted / total * 100) if total > 0 else 0, 1),
        }


def get_lead_count() -> int:
    """Get total number of leads."""
    with get_connection() as conn:
        return conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]


def delete_lead(lead_id: str):
    """Delete a lead from the database."""
    with get_connection() as conn:
        conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))


def list_conversations():
    """List all conversations joined with lead details."""
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT c.*, l.name as full_name, l.decayed_score as base_score
            FROM conversations c
            LEFT JOIN leads l ON c.lead_id = l.id
            ORDER BY c.created_at DESC
        """).fetchall()
        return [dict(r) for r in rows]


def get_conversation(conv_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,)).fetchone()
        return dict(row) if row else None


def get_or_create_conversation(lead_id: str, channel: str, external_id: str) -> int:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM conversations WHERE channel = ? AND external_id = ?",
            (channel, external_id)
        ).fetchone()
        if row:
            return row["id"]
        cur = conn.execute(
            "INSERT INTO conversations (lead_id, channel, external_id, created_at) VALUES (?, ?, ?, ?)",
            (lead_id, channel, external_id, datetime.now().isoformat())
        )
        return cur.lastrowid


def list_messages(conversation_id: int):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            (conversation_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def add_message(conversation_id: int, direction: str, channel: str, body: str):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO messages (conversation_id, direction, channel, body, timestamp) VALUES (?, ?, ?, ?, ?)",
            (conversation_id, direction, channel, body, datetime.now().isoformat())
        )
