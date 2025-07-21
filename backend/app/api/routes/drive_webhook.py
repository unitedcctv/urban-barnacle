"""Webhook endpoint for Google Drive push notifications."""
from fastapi import APIRouter, Header, HTTPException, status, Depends
from app.ai import drive_sync
from app.api.deps import CurrentUser
from app.models import UserPermission
from app.ai.settings import settings as ai_settings

router = APIRouter(prefix="/drive", tags=["ai"])



@router.post("/register-watch", tags=["ai"])
async def register_watch_endpoint(current_user: CurrentUser):
    """Manually trigger creation of a Drive watch channel.
    Requires SUPERUSER permission.
    """
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = drive_sync.register_watch()
    return result


@router.post("/populate-chunks", tags=["ai"])
async def populate_chunks_endpoint(current_user: CurrentUser):
    """Manually populate chunks table with business plan content.
    Requires SUPERUSER permission.
    """
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        drive_sync.update_from_webhook()
        return {"message": "Chunks table populated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to populate chunks: {str(e)}")


@router.post("/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def drive_change_webhook(
    x_goog_resource_state: str = Header(None),
    x_goog_channel_token: str | None = Header(None),
):
    if ai_settings.DRIVE_WEBHOOK_TOKEN and x_goog_channel_token != ai_settings.DRIVE_WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid webhook token")

    drive_sync.update_from_webhook()
