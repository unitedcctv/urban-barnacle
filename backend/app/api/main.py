from fastapi import APIRouter

from app.api.routes import (
    enquiries,
    images,
    items,
    login,
    logs,
    models,
    navigation,
    nfc,
    payments,
    private,
    todos,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(images.router)
api_router.include_router(logs.router)
api_router.include_router(models.router)
api_router.include_router(payments.router)
api_router.include_router(navigation.router)
api_router.include_router(nfc.router)
api_router.include_router(todos.router)
api_router.include_router(enquiries.router)


# Temporarily disabled to test signup endpoint
if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
