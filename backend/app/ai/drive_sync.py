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
    """
    Register a Google Drive watch for the business plan document.
    Uses VITE_WEBHOOK_URL if set, otherwise constructs the callback URL
    from available environment variables or defaults to localhost for dev.
    """
    from app.core.config import settings as core_settings
    
    # Priority order for webhook URL:
    # 1. VITE_WEBHOOK_URL (explicit override, e.g., ngrok for local dev)
    # 2. Construct from FRONTEND_HOST if it's HTTPS (staging/production)
    # 3. Default to localhost for local development
    webhook_url = ai_settings.VITE_WEBHOOK_URL
    
    if not webhook_url:
        # Try to use FRONTEND_HOST if it's HTTPS (staging/production)
        frontend_host = getattr(core_settings, 'FRONTEND_HOST', None)
        if frontend_host and frontend_host.startswith('https://'):
            # Replace frontend port/path with backend webhook endpoint
            # e.g., https://staging.example.com -> https://staging.example.com/api/v1/drive/webhook
            base_url = frontend_host.rstrip('/')
            webhook_url = f"{base_url}/api/v1/drive/webhook"
        else:
            # Default to localhost:8000 for local development
            webhook_url = "http://localhost:8000/api/v1/drive/webhook"
    
    drive = _drive_client()
    body = {
        "id": f"business-plan-watch-{uuid.uuid4()}",
        "type": "web_hook",
        "address": webhook_url,
        "token": ai_settings.DRIVE_WEBHOOK_TOKEN,
    }
    return drive.files().watch(fileId=DOC_ID, body=body).execute()
