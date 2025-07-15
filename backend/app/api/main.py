from fastapi import APIRouter

from app.api.routes import (
    images,
    items,
    login,
    private,
    users,
    utils,
    sidebar,
    ai_chat,
    drive_webhook,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(images.router)
api_router.include_router(sidebar.router)
api_router.include_router(ai_chat.router)
api_router.include_router(drive_webhook.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
