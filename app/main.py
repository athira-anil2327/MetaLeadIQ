import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app import database as db
from app.routers import webhooks, leads, inbox

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="MetaLeadIQ",
    description="Real-time lead scoring + unified WhatsApp/Instagram/Meta-Ads inbox",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router)
app.include_router(leads.router)
app.include_router(inbox.router)


@app.on_event("startup")
def startup():
    db.init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def dashboard():
    return FileResponse("static/dashboard.html")


app.mount("/static", StaticFiles(directory="static"), name="static")
