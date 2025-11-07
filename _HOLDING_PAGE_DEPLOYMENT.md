# Holding Page Deployment Guide

## Overview
A simple, elegant holding page has been created for the UBDM production site. The page displays the UBDM logo with a "Coming Soon" message.

## Changes Made

### 1. Frontend Files
- **`frontend/index.html`**: Replaced with a standalone holding page featuring:
  - UBDM logo with smooth animations
  - Clean, modern gradient background
  - Responsive design for mobile and desktop
  - "Coming Soon" badge
  
- **`frontend/public/logo.svg`**: Copied the UBDM logo to public directory for easy access

### 2. Dockerfile Simplification
- **`frontend/Dockerfile`**: Simplified to skip the Node.js build process
  - Now directly copies static files to nginx
  - Much faster build time
  - No dependencies on Node.js or React for the holding page

## Testing
The holding page has been tested locally and verified to display correctly on port 8080.

## Deployment to Production

### Option 1: Deploy via GitHub Release (Recommended)
1. Commit the changes:
   ```bash
   git add frontend/index.html frontend/public/logo.svg frontend/Dockerfile
   git commit -m "Add holding page for production"
   git push origin master
   ```

2. Create a GitHub Release:
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Create a new tag (e.g., `v1.0.0-holding`)
   - Add release notes
   - Click "Publish release"

3. The GitHub Action will automatically:
   - Build the Docker images
   - Deploy to your production server (ubdm.io)
   - The holding page will be live at https://dashboard.ubdm.io

### Option 2: Manual Deployment
If you have direct access to the production server:

1. Commit and push changes to master
2. SSH into your production server
3. Navigate to your project directory
4. Pull the latest changes:
   ```bash
   git pull origin master
   ```
5. Build and deploy:
   ```bash
   docker compose -f docker-compose.yml --project-name <YOUR_STACK_NAME> build
   docker compose -f docker-compose.yml --project-name <YOUR_STACK_NAME> up -d
   ```

## Reverting to Full Application
When you're ready to deploy the full application:

1. Restore the original `frontend/index.html`:
   ```bash
   git checkout <commit-before-holding-page> -- frontend/index.html
   ```

2. Restore the original `frontend/Dockerfile`:
   ```bash
   git checkout <commit-before-holding-page> -- frontend/Dockerfile
   ```

3. Commit and deploy using one of the methods above

## URLs
- **Production Frontend**: https://dashboard.ubdm.io
- **Staging Frontend**: https://dashboard.staging.ubdm.io (unchanged)

## Notes
- The staging environment remains unchanged with the full application
- Only production will show the holding page after deployment
- The backend API will still be running but won't be accessible from the holding page
- All user data and database remain intact
