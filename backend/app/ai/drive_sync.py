"""Google Drive export & webhook sync utilities."""
import os
import uuid
import json
from pathlib import Path
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build

from .embeddings import rebuild_chunks
from app.ai.settings import settings as ai_settings

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
DOC_ID = ai_settings.BUSINESS_PLAN_DOC_ID
EXPORT_PATH = Path(ai_settings.DATA_DIR) / "business_plan.txt"


def _drive_client():
    """Create Google Drive client with credentials from environment variable."""
    service_account_json = ai_settings.GDRIVE_SERVICE_ACCOUNT_JSON
    
    if not service_account_json:
        raise ValueError("GDRIVE_SERVICE_ACCOUNT_JSON environment variable is required")
    
    try:
        service_account_info = json.loads(service_account_json)
        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError(f"Invalid GDRIVE_SERVICE_ACCOUNT_JSON format: {e}")
    
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def export_doc() -> Path:
    """Download the Google Doc as plain text and write to disk.
    Returns path to the written file.
    """
    drive = _drive_client()

    data = (
        drive.files()
        .export(fileId=DOC_ID, mimeType="text/plain")
        .execute()
    )
    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXPORT_PATH.write_bytes(data)   
    return EXPORT_PATH


def update_from_webhook():
    """Called by webhook handler when Drive notifies of a change."""
    export_doc()
    rebuild_chunks(EXPORT_PATH)


# Helpers for registering watch (run once manually)

def register_watch() -> dict:
    """Register a Google Drive webhook for the business plan document.
    
    Uses VITE_WEBHOOK_URL from environment if available (for local dev with ngrok),
    otherwise constructs the callback URL from BACKEND_HOST.
    """
    from app.core.config import settings as core_settings
    
    # Use ngrok URL for local dev, or construct from backend host
    webhook_url = ai_settings.VITE_WEBHOOK_URL
    if not webhook_url:
        backend_host = core_settings.BACKEND_HOST or "http://localhost:8000"
        webhook_url = f"{backend_host}/api/v1/drive/webhook"
    
    drive = _drive_client()
    body = {
        "id": f"business-plan-watch-{uuid.uuid4()}",
        "type": "web_hook",
        "address": webhook_url,
        "token": ai_settings.DRIVE_WEBHOOK_TOKEN,
    }
    return drive.files().watch(fileId=DOC_ID, body=body).execute()
