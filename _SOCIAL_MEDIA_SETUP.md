# Social Media Integration Setup

This document explains how to configure the social media integration for the community page.

## Overview

The application fetches and displays the latest 3 posts from each social media platform:
- Mastodon
- Bluesky
- Reddit
- LinkedIn

Posts are fetched every 5 minutes by a background scheduler and cached in the database.

## Environment Variables

Add the following variables to your `.env` file:

### Mastodon

```bash
MASTODON_INSTANCE_URL=https://your-instance.social
MASTODON_ACCESS_TOKEN=your_access_token
```

**How to get credentials:**
1. Go to your Mastodon instance settings
2. Navigate to Development → New Application
3. Grant read permissions
4. Copy the access token

### Bluesky

```bash
BLUESKY_HANDLE=your.handle.bsky.social
BLUESKY_APP_PASSWORD=your_app_password
```

**How to get credentials:**
1. Go to Settings → App Passwords
2. Create a new app password
3. Use your handle and the generated password

### Reddit

```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
```

**How to get credentials:**
1. Go to https://www.reddit.com/prefs/apps
2. Create an app (script type)
3. Copy the client ID and secret
4. Use your Reddit username

### LinkedIn

```bash
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_ORG_ID=your_organization_id
```

**How to get credentials:**
1. Create an app at https://www.linkedin.com/developers/
2. Get OAuth 2.0 credentials
3. Generate an access token with `r_liteprofile` and `r_organization_social` permissions
4. Get your organization ID from your LinkedIn company page URL

### Frontend URLs

Add these to your `.env` file for the frontend social media links:

```bash
VITE_MASTODON_URL=https://your-instance.social/@yourusername
VITE_BLUESKY_URL=https://bsky.app/profile/your.handle.bsky.social
VITE_REDDIT_URL=https://reddit.com/u/yourusername
VITE_LINKEDIN_URL=https://linkedin.com/company/yourcompany
```

## Installation

1. **Install dependencies:**

```bash
cd backend
uv pip install -e .
```

This will install `apscheduler>=3.10.4` and other required packages.

2. **Run database migration:**

```bash
cd backend
alembic upgrade head
```

This creates the `socialpost` table for caching posts.

3. **Start the backend:**

```bash
cd backend
uvicorn app.main:app --reload
```

The scheduler will start automatically and fetch posts every 5 minutes.

## Usage

### Automatic Updates

- The background scheduler fetches posts every 5 minutes
- Posts are cached in the database
- The frontend automatically refetches from the cache every 5 minutes

### Manual Refresh

To manually trigger a refresh (superuser only):

```bash
POST /api/v1/social/refresh
```

### View Posts

Navigate to `/community` on the frontend to see the latest posts.

## API Endpoints

### GET /api/v1/social/posts

Returns cached social media posts from all platforms.

**Response:**
```json
{
  "mastodon": [
    {
      "id": 1,
      "platform": "mastodon",
      "post_id": "123456",
      "author": "Author Name",
      "author_avatar": "https://...",
      "content": "Post content...",
      "url": "https://...",
      "created_at": "2025-10-15T12:00:00Z",
      "likes": 10,
      "reposts": 5,
      "replies": 2
    }
  ],
  "bluesky": [...],
  "reddit": [...],
  "linkedin": [...],
  "last_updated": "2025-10-15T12:05:00Z"
}
```

### POST /api/v1/social/refresh

Manually trigger a refresh of all social media posts.

## Architecture

### Backend

- **Models:** `models_social.py` - SQLModel schemas for social posts
- **Service:** `services/social_media.py` - Fetches posts from APIs
- **Scheduler:** `services/scheduler.py` - Background task scheduler
- **Routes:** `api/routes/social_media.py` - API endpoints

### Frontend

- **Component:** `SocialPostCard.tsx` - Displays individual posts
- **Page:** `routes/_layout/community.tsx` - Main community page
- **Styling:** Platform-specific colors and responsive grid layout

## Troubleshooting

### No posts showing up

1. Check that environment variables are set correctly
2. Check backend logs for API errors
3. Verify credentials have the correct permissions
4. Check database to see if posts are being cached:

```sql
SELECT * FROM socialpost;
```

### Posts not updating

1. Check that the scheduler is running (backend logs)
2. Manually trigger a refresh via `/api/v1/social/refresh`
3. Check for rate limiting from social media APIs

### API Rate Limits

Each platform has different rate limits:
- **Mastodon:** Usually 300 requests per 5 minutes
- **Bluesky:** Fair use policy, no hard limits
- **Reddit:** 60 requests per minute
- **LinkedIn:** Varies by API, typically 500 requests per day

The 5-minute polling interval is designed to stay well within these limits.

## Security Notes

- Never commit `.env` files with credentials
- Store API keys securely
- Use app-specific passwords where available (Bluesky, Reddit)
- Regularly rotate access tokens
- LinkedIn tokens expire - you'll need to refresh them periodically

## Future Enhancements

- WebSocket support for real-time updates
- User-specific feeds
- Post filtering and search
- Engagement metrics dashboard
- Multi-account support per platform
