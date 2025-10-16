"""API routes for social media posts"""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_current_active_superuser, get_db
from app.models_social import PlatformData, SocialPostPublic, SocialPostsResponse
from app.services.social_media import SocialMediaService

router = APIRouter()


@router.get("/posts", response_model=SocialPostsResponse)
async def get_social_posts(
    db: Session = Depends(get_db),
) -> SocialPostsResponse:
    """
    Get the latest social media posts from all platforms.
    Returns cached posts from the database.
    """
    service = SocialMediaService(db)
    
    mastodon_posts = service.get_cached_posts("mastodon", limit=3)
    bluesky_posts = service.get_cached_posts("bluesky", limit=3)
    reddit_posts = service.get_cached_posts("reddit", limit=3)
    linkedin_posts = service.get_cached_posts("linkedin", limit=3)

    # Get most recent fetch time
    all_posts = mastodon_posts + bluesky_posts + reddit_posts + linkedin_posts
    last_updated = max([p.fetched_at for p in all_posts]) if all_posts else datetime.utcnow()

    return SocialPostsResponse(
        mastodon=PlatformData(
            posts=[SocialPostPublic.model_validate(p) for p in mastodon_posts],
            error="No posts available" if not mastodon_posts else None
        ),
        bluesky=PlatformData(
            posts=[SocialPostPublic.model_validate(p) for p in bluesky_posts],
            error="No posts available" if not bluesky_posts else None
        ),
        reddit=PlatformData(
            posts=[SocialPostPublic.model_validate(p) for p in reddit_posts],
            error="No posts available" if not reddit_posts else None
        ),
        linkedin=PlatformData(
            posts=[SocialPostPublic.model_validate(p) for p in linkedin_posts],
            error="No posts available" if not linkedin_posts else None
        ),
        last_updated=last_updated,
    )


@router.post("/refresh", dependencies=[Depends(get_current_active_superuser)])
async def refresh_social_posts(
    db: Session = Depends(get_db),
) -> dict:
    """
    Manually trigger a refresh of social media posts.
    This endpoint can only be called by superusers to force an update.
    """
    service = SocialMediaService(db)
    await service.fetch_all_posts()
    
    return {"message": "Social media posts refreshed successfully"}
