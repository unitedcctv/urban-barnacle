import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize application on startup."""
    # Setup log buffer for viewing logs via HTTP
    from app.api.routes.logs import setup_log_buffer
    setup_log_buffer()
    
    # Start background scheduler for social media posts
    from app.services.scheduler import start_scheduler, fetch_social_media_posts
    start_scheduler()
    
    # Fetch social media posts immediately on startup
    await fetch_social_media_posts()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Cleanup on application shutdown."""
    from app.services.scheduler import shutdown_scheduler
    shutdown_scheduler()


# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for local development (uploads directory)
# Ensure the uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Convenience endpoint for front-end requesting current user
from app.api.deps import CurrentUser  # noqa: E402  noqa: F401
from app.models import UserPublic  # noqa: E402


@app.get("/api/currentUser", response_model=UserPublic, tags=["users"])
def api_current_user(current_user: CurrentUser) -> UserPublic:  # noqa: D401
    """Return the authenticated user (used by React app)."""
    return current_user
