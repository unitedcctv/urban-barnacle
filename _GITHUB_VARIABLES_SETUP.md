# GitHub Variables Setup for Social Media Links

This document explains how to configure the social media link environment variables in GitHub for staging and production deployments.

## Overview

The community page includes social media links that are configured via environment variables during the Docker build process. These variables need to be set up in GitHub's repository settings.

## Required GitHub Variables

Add the following variables to your GitHub repository for both **staging** and **production** environments:

| Variable Name | Type | Description | Example Value |
|---------------|------|-------------|---------------|
| `VITE_MASTODON_URL` | Variable | URL to your Mastodon profile | `https://mastodon.social/@youraccount` |
| `VITE_BLUESKY_URL` | Variable | URL to your Bluesky profile | `https://bsky.app/profile/youraccount` |
| `VITE_REDDIT_URL` | Variable | URL to your Reddit community | `https://reddit.com/r/yourcommunity` |
| `VITE_LINKEDIN_URL` | Variable | URL to your LinkedIn company page | `https://linkedin.com/company/yourcompany` |

## How to Add Variables in GitHub

### For Staging Environment

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click on the **Variables** tab
4. Click **New repository variable** or **New environment variable**
5. If using environment-specific variables:
   - Select the **staging** environment
   - Add each variable with its name and value
6. Click **Add variable**

### For Production Environment

Follow the same steps as staging, but select the **production** environment instead.

## Optional Variables

All four social media variables are **optional**. If a variable is not set:
- The corresponding social media icon will not appear on the community page footer
- The build will still succeed
- No errors will occur

This allows you to only display the social media links that are relevant to your community.

## Testing Locally

For local development, add these variables to your `frontend/.env` file:

```env
VITE_MASTODON_URL=https://mastodon.social/@youraccount
VITE_BLUESKY_URL=https://bsky.app/profile/youraccount
VITE_REDDIT_URL=https://reddit.com/r/yourcommunity
VITE_LINKEDIN_URL=https://linkedin.com/company/yourcompany
```

## How It Works

1. **GitHub Actions**: The variables are read from GitHub's environment during deployment
2. **Docker Compose**: The variables are passed as build arguments to the frontend container
3. **Dockerfile**: The variables are declared as ARG and become available during the Vite build
4. **Vite Build**: The `import.meta.env.VITE_*` values are replaced with actual values at build time
5. **Static Output**: The final built HTML/JS contains the hardcoded URLs (no runtime environment variables needed)

## Deployment Flow

```
GitHub Vars → Workflow env → docker-compose build args → Dockerfile ARG → Vite build → Static files
```

## Important Notes

- ⚠️ These are **build-time** variables, not runtime variables
- Changes require rebuilding and redeploying the frontend container
- The values are compiled into the static frontend assets
- For security, these are public URLs only - never put sensitive data here

## Verifying the Setup

After deployment, you can verify the variables were properly configured by:

1. Visiting the community page at `https://yourdomain.com/community`
2. Checking that the social media icons appear in the footer
3. Clicking each icon to verify the correct URL is used

## Troubleshooting

### Icons not appearing
- Check that the GitHub variables are set in the correct environment (staging/production)
- Verify the variable names match exactly (case-sensitive)
- Rebuild and redeploy the frontend container

### Wrong URLs
- Update the GitHub variable values
- Trigger a new deployment to rebuild the frontend

### Lint warnings in workflow files
- Warnings like "Context access might be invalid" are expected before variables are created
- These warnings will disappear once you add the variables in GitHub
