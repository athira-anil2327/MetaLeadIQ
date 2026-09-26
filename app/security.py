"""
Meta signs every webhook POST body with your App Secret
(header: X-Hub-Signature-256). Always verify it in production so nobody can
spoof leads or messages by POSTing directly to your endpoint.
"""
import hmac
import hashlib

from app.config import settings


def verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    if settings.APP_ENV == "development" and not settings.META_APP_SECRET:
        # Allow local testing without a configured app secret.
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        settings.META_APP_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    provided = signature_header.split("sha256=", 1)[1]
    return hmac.compare_digest(expected, provided)
