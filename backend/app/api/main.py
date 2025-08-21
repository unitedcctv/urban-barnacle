from fastapi import APIRouter

from app.api.routes import (
    blockchain,
    images,
    items,
    login,
    models,
    payments,
    private,
    users,
    utils,
    navigation,
    ai_chat,
    drive_webhook,
    business_plan,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(images.router)
api_router.include_router(models.router)
api_router.include_router(payments.router)
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["blockchain"])
api_router.include_router(navigation.router)
api_router.include_router(ai_chat.router)
api_router.include_router(drive_webhook.router)
api_router.include_router(business_plan.router)


# Temporarily disabled to test signup endpoint
if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
