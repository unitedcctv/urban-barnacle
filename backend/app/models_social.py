from datetime import datetime
from sqlmodel import Field, SQLModel


class SocialPost(SQLModel, table=True):
    """Social media post model for storing cached posts"""
    id: int | None = Field(default=None, primary_key=True)
    platform: str = Field(index=True)  # mastodon, bluesky, reddit, linkedin
    post_id: str = Field(unique=True, index=True)  # Unique ID from the platform
    author: str
    author_avatar: str | None = None
    content: str
    url: str
    created_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = 0
    reposts: int = 0
    replies: int = 0


class SocialPostPublic(SQLModel):
    """Schema for returning social media posts to the frontend"""
    id: int
    platform: str
    post_id: str
    author: str
    author_avatar: str | None
    content: str
    url: str
    created_at: datetime
    likes: int
    reposts: int
    replies: int


class PlatformData(SQLModel):
    """Data for a single platform including posts and error status"""
    posts: list[SocialPostPublic]
    error: str | None = None


class SocialPostsResponse(SQLModel):
    """Response containing posts from all platforms"""
    mastodon: PlatformData
    bluesky: PlatformData
    reddit: PlatformData
    linkedin: PlatformData
    last_updated: datetime
