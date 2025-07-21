"""Webhook endpoint for Google Drive push notifications."""
from fastapi import APIRouter, Header, HTTPException, status, Depends
from app.ai import drive_sync
from app.api.deps import CurrentUser
from app.models import UserPermission
from app.ai.settings import settings as ai_settings

router = APIRouter(prefix="/drive", tags=["ai"])



@router.post("/register-watch", tags=["ai"])
async def register_watch_endpoint(current_user: CurrentUser):
    """
    Manually trigger creation of a Drive watch channel.
    Requires SUPERUSER permission.
    """
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        result = drive_sync.register_watch()
        return {"success": True, "data": result, "message": "Drive watch registered successfully"}
    except ValueError as e:
        # Handle configuration errors (missing env vars, etc.)
        raise HTTPException(
            status_code=400, 
            detail=f"Configuration error: {str(e)}"
        )
    except Exception as e:
        # Handle Google Drive API errors and other exceptions
        error_msg = str(e)
        if "HttpError" in str(type(e)):
            # Extract meaningful error from Google API HttpError
            if "webhookUrlNotHttps" in error_msg:
                error_msg = "Webhook URL must be HTTPS. Check your VITE_WEBHOOK_URL or FRONTEND_HOST configuration."
            elif "push.webhookCallbackUrlUnauthorized" in error_msg:
                error_msg = "Webhook URL is not authorized. Ensure your domain is properly configured."
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register Drive watch: {error_msg}"
        )


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
