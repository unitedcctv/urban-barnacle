"""Webhook endpoint for Google Drive push notifications."""
from fastapi import APIRouter, Header, HTTPException, status
from app.ai import drive_sync
from app.ai.settings import settings as ai_settings

router = APIRouter(prefix="/drive", tags=["ai"])


@router.post("/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def drive_change_webhook(
    x_goog_resource_state: str = Header(None),
    x_goog_channel_token: str | None = Header(None),
):
    """Google sends a POST on any change to the watched file.
    We validate token (if provided) and trigger a re-export & re-embed.
    Google expects a 2xx quickly; do heavy work async if needed.
    """
    if ai_settings.DRIVE_WEBHOOK_TOKEN and x_goog_channel_token != ai_settings.DRIVE_WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid webhook token")

    # Optional: you can filter on x_goog_resource_state; for simplicity always refresh.
    drive_sync.update_from_webhook()
    # Return 204
