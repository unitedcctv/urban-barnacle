"""Google Drive export & webhook sync utilities."""
import os
import uuid
from pathlib import Path
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build

from .embeddings import rebuild_chunks
from .settings import settings

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
DOC_ID = settings.BUSINESS_PLAN_DOC_ID
EXPORT_PATH = Path(settings.DATA_DIR) / "business_plan.txt"


def _drive_client():
    creds = service_account.Credentials.from_service_account_file(
        settings.GDRIVE_SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
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
    EXPORT_PATH.write_bytes(data)
    return EXPORT_PATH


def update_from_webhook():
    """Called by webhook handler when Drive notifies of a change."""
    export_doc()
    rebuild_chunks(EXPORT_PATH)


# Helpers for registering watch (run once manually)

def register_watch(callback_url: str) -> dict:
    drive = _drive_client()
    body = {
        "id": f"business-plan-watch-{uuid.uuid4()}",
        "type": "web_hook",
        "address": callback_url,
        "token": settings.DRIVE_WEBHOOK_TOKEN,
    }
    return drive.files().watch(fileId=DOC_ID, body=body).execute()
