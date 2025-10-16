"""Social media integration service for fetching posts from various platforms"""
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlmodel import Session, select

from app.core.config import settings
from app.models_social import SocialPost

logger = logging.getLogger(__name__)


class SocialMediaService:
    """Service for fetching and caching social media posts"""

    def __init__(self, db: Session):
        self.db = db

    async def fetch_mastodon_posts(self, limit: int = 3) -> tuple[list[SocialPost], str | None]:
        """Fetch recent posts from Mastodon"""
        if not settings.MASTODON_INSTANCE_URL or not settings.MASTODON_ACCESS_TOKEN:
            logger.warning("Mastodon credentials not configured")
            return [], "Mastodon credentials not configured"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.MASTODON_INSTANCE_URL}/api/v1/accounts/verify_credentials",
                    headers={"Authorization": f"Bearer {settings.MASTODON_ACCESS_TOKEN}"},
                )
                
                if response.status_code != 200:
                    error_msg = response.json().get("error", response.text) if response.text else "Authentication failed"
                    logger.error(f"Mastodon auth failed: {error_msg}")
                    return [], f"Mastodon authentication failed: {error_msg}. Required scope: read:accounts"
                
                account = response.json()
                account_id = account["id"]

                # Fetch statuses
                response = await client.get(
                    f"{settings.MASTODON_INSTANCE_URL}/api/v1/accounts/{account_id}/statuses",
                    headers={"Authorization": f"Bearer {settings.MASTODON_ACCESS_TOKEN}"},
                    params={"limit": limit, "exclude_replies": True, "exclude_reblogs": True},
                )
                
                if response.status_code != 200:
                    error_msg = response.json().get("error", response.text) if response.text else "Failed to fetch posts"
                    logger.error(f"Mastodon fetch failed: {error_msg}")
                    return [], f"Failed to fetch Mastodon posts: {error_msg}"
                
                statuses = response.json()

                posts = []
                for status in statuses[:limit]:
                    post = SocialPost(
                        platform="mastodon",
                        post_id=status["id"],
                        author=status["account"]["display_name"] or status["account"]["username"],
                        author_avatar=status["account"]["avatar"],
                        content=status["content"],
                        url=status["url"],
                        created_at=datetime.fromisoformat(status["created_at"].replace("Z", "+00:00")),
                        likes=status.get("favourites_count", 0),
                        reposts=status.get("reblogs_count", 0),
                        replies=status.get("replies_count", 0),
                    )
                    posts.append(post)
                    self._upsert_post(post)

                if not posts:
                    return [], "No posts available"

                return posts, None

        except Exception as e:
            logger.error(f"Error fetching Mastodon posts: {e}")
            return [], str(e)

    async def fetch_bluesky_posts(self, limit: int = 3) -> tuple[list[SocialPost], str | None]:
        """Fetch recent posts from Bluesky"""
        if not settings.BLUESKY_HANDLE or not settings.BLUESKY_APP_PASSWORD:
            logger.warning("Bluesky credentials not configured")
            return [], "Bluesky credentials not configured"

        try:
            async with httpx.AsyncClient() as client:
                # Login to get session
                auth_response = await client.post(
                    "https://bsky.social/xrpc/com.atproto.server.createSession",
                    json={
                        "identifier": settings.BLUESKY_HANDLE,
                        "password": settings.BLUESKY_APP_PASSWORD,
                    },
                )
                session = auth_response.json()
                access_token = session["accessJwt"]
                did = session["did"]

                # Fetch author feed
                response = await client.get(
                    "https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"actor": did, "limit": limit},
                )
                feed = response.json()

                posts = []
                for item in feed.get("feed", [])[:limit]:
                    post_data = item["post"]
                    record = post_data["record"]
                    
                    post = SocialPost(
                        platform="bluesky",
                        post_id=post_data["uri"],
                        author=post_data["author"]["displayName"] or post_data["author"]["handle"],
                        author_avatar=post_data["author"].get("avatar"),
                        content=record.get("text", ""),
                        url=f"https://bsky.app/profile/{post_data['author']['handle']}/post/{post_data['uri'].split('/')[-1]}",
                        created_at=datetime.fromisoformat(record["createdAt"].replace("Z", "+00:00")),
                        likes=post_data.get("likeCount", 0),
                        reposts=post_data.get("repostCount", 0),
                        replies=post_data.get("replyCount", 0),
                    )
                    posts.append(post)
                    self._upsert_post(post)

                return posts, None

        except Exception as e:
            logger.error(f"Error fetching Bluesky posts: {e}")
            return [], str(e)

    async def fetch_reddit_posts(self, limit: int = 3) -> tuple[list[SocialPost], str | None]:
        """Fetch recent posts from Reddit"""
        if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET or not settings.REDDIT_USERNAME:
            logger.warning("Reddit credentials not configured")
            return [], "Reddit credentials not configured"

        try:
            async with httpx.AsyncClient() as client:
                # Get OAuth token
                auth = httpx.BasicAuth(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET)
                token_response = await client.post(
                    "https://www.reddit.com/api/v1/access_token",
                    auth=auth,
                    data={"grant_type": "client_credentials"},
                    headers={"User-Agent": f"{settings.PROJECT_NAME}/1.0"},
                )
                token_data = token_response.json()
                access_token = token_data["access_token"]

                # Fetch user posts
                response = await client.get(
                    f"https://oauth.reddit.com/user/{settings.REDDIT_USERNAME}/submitted",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "User-Agent": f"{settings.PROJECT_NAME}/1.0",
                    },
                    params={"limit": limit, "sort": "new"},
                )
                data = response.json()

                posts = []
                for child in data.get("data", {}).get("children", [])[:limit]:
                    post_data = child["data"]
                    
                    post = SocialPost(
                        platform="reddit",
                        post_id=post_data["id"],
                        author=post_data["author"],
                        author_avatar=None,  # Reddit API doesn't provide avatars in this endpoint
                        content=post_data.get("selftext", post_data.get("title", "")),
                        url=f"https://reddit.com{post_data['permalink']}",
                        created_at=datetime.fromtimestamp(post_data["created_utc"], tz=timezone.utc),
                        likes=post_data.get("ups", 0),
                        reposts=0,
                        replies=post_data.get("num_comments", 0),
                    )
                    posts.append(post)
                    self._upsert_post(post)

                return posts, None

        except Exception as e:
            logger.error(f"Error fetching Reddit posts: {e}")
            return [], str(e)

    async def fetch_linkedin_posts(self, limit: int = 3) -> tuple[list[SocialPost], str | None]:
        """Fetch recent posts from LinkedIn"""
        if not settings.LINKEDIN_ACCESS_TOKEN or not settings.LINKEDIN_ORG_ID:
            logger.warning("LinkedIn credentials not configured")
            return [], "LinkedIn credentials not configured"

        try:
            async with httpx.AsyncClient() as client:
                # Fetch organization posts
                response = await client.get(
                    f"https://api.linkedin.com/v2/ugcPosts",
                    headers={
                        "Authorization": f"Bearer {settings.LINKEDIN_ACCESS_TOKEN}",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                    params={
                        "q": "authors",
                        "authors": f"urn:li:organization:{settings.LINKEDIN_ORG_ID}",
                        "count": limit,
                    },
                )
                data = response.json()

                posts = []
                for element in data.get("elements", [])[:limit]:
                    content_text = ""
                    if "specificContent" in element and "com.linkedin.ugc.ShareContent" in element["specificContent"]:
                        share_content = element["specificContent"]["com.linkedin.ugc.ShareContent"]
                        if "shareCommentary" in share_content:
                            content_text = share_content["shareCommentary"].get("text", "")

                    post_id = element["id"].split(":")[-1]
                    
                    post = SocialPost(
                        platform="linkedin",
                        post_id=post_id,
                        author=settings.PROJECT_NAME,  # Organization name
                        author_avatar=None,
                        content=content_text,
                        url=f"https://www.linkedin.com/feed/update/{element['id']}",
                        created_at=datetime.fromtimestamp(element["created"]["time"] / 1000, tz=timezone.utc),
                        likes=element.get("numLikes", 0),
                        reposts=element.get("numShares", 0),
                        replies=element.get("numComments", 0),
                    )
                    posts.append(post)
                    self._upsert_post(post)

                return posts, None

        except Exception as e:
            logger.error(f"Error fetching LinkedIn posts: {e}")
            return [], str(e)

    def _upsert_post(self, post: SocialPost) -> None:
        """Insert or update a post in the database"""
        try:
            # Check if post already exists
            statement = select(SocialPost).where(SocialPost.post_id == post.post_id)
            existing = self.db.exec(statement).first()

            if existing:
                # Update existing post
                existing.content = post.content
                existing.likes = post.likes
                existing.reposts = post.reposts
                existing.replies = post.replies
                existing.fetched_at = datetime.utcnow()
            else:
                # Insert new post
                self.db.add(post)

            self.db.commit()
        except Exception as e:
            logger.error(f"Error upserting post {post.post_id}: {e}")
            self.db.rollback()

    def get_cached_posts(self, platform: str, limit: int = 3) -> list[SocialPost]:
        """Get cached posts for a platform from the database"""
        statement = (
            select(SocialPost)
            .where(SocialPost.platform == platform)
            .order_by(SocialPost.created_at.desc())
            .limit(limit)
        )
        return list(self.db.exec(statement).all())

    async def fetch_all_posts(self) -> dict[str, tuple[list[SocialPost], str | None]]:
        """Fetch posts from all platforms"""
        return {
            "mastodon": await self.fetch_mastodon_posts(),
            # "bluesky": await self.fetch_bluesky_posts(),
            # "reddit": await self.fetch_reddit_posts(),
            # "linkedin": await self.fetch_linkedin_posts(),
        }
