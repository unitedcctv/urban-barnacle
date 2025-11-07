# Holding Page Deployment Guide

## Overview
This guide explains how to deploy a simple holding page to production while keeping the full application running on staging.

## Important Note
**The holding page implementation has been REVERTED from the main branch.** The main branch now contains the full React application for staging. To deploy a holding page to production, you must create it separately for production releases only.

## Current State
- **Staging** (`staging.ubdm.io`): Full React application
- **Production** (`ubdm.io`): To be determined (full app or holding page)
- **Dashboard subdomain removed**: Both staging and production now use base domains only

## URLs Updated
- ~~`dashboard.staging.ubdm.io`~~ **REMOVED**
- `staging.ubdm.io` - Full React app (staging)
- ~~`dashboard.ubdm.io`~~ **REMOVED**  
- `ubdm.io` - Production site

## How to Deploy Holding Page to Production Only

Since staging deploys from the `main` branch automatically, you need to use a **production branch** or **manual deployment** approach.

### Recommended Approach: Production Branch

1. **Create a production branch with holding page**:
   ```bash
   # Create a new branch from main
   git checkout -b production-holding
   
   # Copy the logo
   cp frontend/src/theme/assets/logo.svg frontend/public/logo.svg
   
   # Replace index.html with holding page
   # (Use the holding page HTML from commit f37c5a8)
   
   # Simplify Dockerfile for static serving
   # (Use simplified Dockerfile from commit f37c5a8)
   
   git add frontend/index.html frontend/public/logo.svg frontend/Dockerfile
   git commit -m "Add holding page for production"
   git push origin production-holding
   ```

2. **Deploy to production server manually**:
   ```bash
   # SSH to production server
   ssh user@production-server
   
   # Navigate to project directory
   cd /path/to/project
   
   # Checkout production branch
   git fetch
   git checkout production-holding
   git pull origin production-holding
   
   # Deploy
   docker compose -f docker-compose.yml --project-name <PRODUCTION_STACK_NAME> build
   docker compose -f docker-compose.yml --project-name <PRODUCTION_STACK_NAME> up -d
   ```

### Alternative: Modify GitHub Actions
You could modify `.github/workflows/deploy-production.yml` to use the `production-holding` branch instead of releases.

## Holding Page HTML Template

Create a simple `frontend/index.html` with:
- UBDM logo display
- "Coming Soon" message
- Responsive design
- Modern gradient background

See commit `f37c5a8` for the complete holding page implementation.

## Simplified Dockerfile for Holding Page

```dockerfile
FROM nginx:1
COPY ./index.html /usr/share/nginx/html/
COPY ./public/ /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
```

## URLs After Deployment
- **Production Frontend**: https://ubdm.io (holding page or full app)
- **Staging Frontend**: https://staging.ubdm.io (always full React app)
- **Backend API**: https://api.ubdm.io (production) / https://api.staging.ubdm.io (staging)

## Notes
- Main branch = staging deployment (automatic on push)
- Production = manual deployment or release-based
- Dashboard subdomains removed (now use base domains)
- Full application always runs on staging
- Backend continues running even with holding page on frontend
