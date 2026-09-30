"""
Central configuration. Reads from environment variables (populated via .env).
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./metaleadiq.db")

    META_APP_ID: str = os.getenv("META_APP_ID", "")
    META_APP_SECRET: str = os.getenv("META_APP_SECRET", "")
    META_WEBHOOK_VERIFY_TOKEN: str = os.getenv("META_WEBHOOK_VERIFY_TOKEN", "")

    META_PAGE_ACCESS_TOKEN: str = os.getenv("META_PAGE_ACCESS_TOKEN", "")

    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")

    INSTAGRAM_PAGE_ACCESS_TOKEN: str = os.getenv("INSTAGRAM_PAGE_ACCESS_TOKEN", "")
    INSTAGRAM_BUSINESS_ACCOUNT_ID: str = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")

    GRAPH_API_VERSION: str = os.getenv("GRAPH_API_VERSION", "v21.0")

    MODEL_DIR: str = os.getenv("MODEL_DIR", "./model_artifacts")

    # Decay / scoring constants (mirrors the methodology dossier)
    HALF_LIFE_HOURS: float = 24.0
    HOT_THRESHOLD: float = 70.0
    WARM_THRESHOLD: float = 40.0
    WALD_Z: float = 1.96
    WALD_N_BASE: float = 30.0


settings = Settings()
