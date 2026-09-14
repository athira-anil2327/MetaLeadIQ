from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import math
import time
from typing import List, Optional
import os

app = FastAPI(title="MetaLeadIQ API")

# Allow CORS for localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DB_PATH", "leads.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for better concurrency
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Step 4, 5, 6 requirements: leads table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_name TEXT,
            base_score REAL,
            total_visits INTEGER,
            hours_uncontacted REAL,
            cpc REAL,
            contacted BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup_event():
    init_db()
    # Insert some dummy data if empty
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM leads")
    count = cursor.fetchone()['count']
    if count == 0:
        dummy_leads = [
            ("Lead A", 0.85, 5, 2.5, 1.2, 0),
            ("Lead B", 0.90, 2, 24.0, 2.5, 0),
            ("Lead C", 0.85, 10, 2.5, 0.8, 0),
            ("Lead D", 0.60, 0, 48.0, 0.5, 0),
            ("Lead E", 0.95, 20, 1.0, 3.0, 0),
        ]
        cursor.executemany('''
            INSERT INTO leads (lead_name, base_score, total_visits, hours_uncontacted, cpc, contacted)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', dummy_leads)
        conn.commit()
    conn.close()

class LeadResponse(BaseModel):
    id: int
    lead_name: str
    base_score: float
    total_visits: int
    hours_uncontacted: float
    cpc: float
    contacted: bool
    decayed_score: float
    margin_of_error: float
    lower_bound: float
    upper_bound: float

@app.get("/api/queue", response_model=List[LeadResponse])
def get_queue():
    """
    Fetches uncontacted leads using Lexicographic Priority: 
    sorted by Decayed Score (DESC), then by CPC or acquisition cost (ASC).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leads WHERE contacted = 0")
    rows = cursor.fetchall()
    conn.close()
    
    leads_processed = []
    for row in rows:
        lead = dict(row)
        p = lead['base_score']
        total_visits = lead['total_visits']
        hours_uncontacted = lead['hours_uncontacted']
        
        # Step 4: Exponential time decay
        # Decayed Score = Base Score * exp(-0.0289 * hours_uncontacted)
        decayed_score = p * math.exp(-0.0289 * hours_uncontacted)
        
        # Step 5: Wald 95% confidence intervals
        # Margin = 1.96 * sqrt((p * (1-p)) / n), where n = 30 + TotalVisits
        n = 30 + total_visits
        margin = 1.96 * math.sqrt((p * (1 - p)) / n)
        
        lead['decayed_score'] = decayed_score
        lead['margin_of_error'] = margin
        lead['lower_bound'] = max(0.0, decayed_score - margin)
        lead['upper_bound'] = min(1.0, decayed_score + margin)
        
        leads_processed.append(lead)
        
    # Step 6: Lexicographic Priority sorting
    # Sorted by Decayed Score (DESC), then by CPC (ASC)
    leads_processed.sort(key=lambda x: (-x['decayed_score'], x['cpc']))
    
    return leads_processed

@app.post("/api/leads/{lead_id}/contact")
def mark_contacted(lead_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE leads SET contacted = 1 WHERE id = ?", (lead_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}
