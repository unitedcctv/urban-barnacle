# Staging Image Upload Troubleshooting Guide

## Quick Diagnostics

### 1. Check Backend Logs
```bash
# If using Docker
docker compose logs backend --tail=100 -f

# If using Kubernetes/other
kubectl logs -f deployment/backend
```

Look for these log entries when uploading:
```
INFO: Upload request: item_id=..., file=..., folder=images
INFO: Environment: staging, BunnyCDN enabled: True/False
INFO: Uploading to BunnyCDN with zone: <zone-name>
# OR
INFO: Uploading to local storage: /app/uploads
```

### 2. Check Environment Variables

Required for **staging/production** with BunnyCDN:
```bash
ENVIRONMENT=staging  # or production
BUNNYCDN_STORAGE_ZONE=<your-storage-zone>
BUNNYCDN_API_KEY=<your-api-key>
```

For **local development** without CDN:
```bash
ENVIRONMENT=local
# BUNNYCDN vars not needed
```

### 3. Common Issues

#### Issue: "BunnyCDN upload failed with status 401"
**Cause**: Invalid API key  
**Fix**: Check `BUNNYCDN_API_KEY` environment variable

#### Issue: "BunnyCDN upload failed with status 404"
**Cause**: Storage zone doesn't exist  
**Fix**: Check `BUNNYCDN_STORAGE_ZONE` name is correct

#### Issue: "Failed to upload file to BunnyCDN: [SSL/Connection error]"
**Cause**: Network/firewall issue  
**Fix**: Ensure backend can reach `storage.bunnycdn.com`

#### Issue: "Permission denied" or "No such file or directory"
**Cause**: Upload directory doesn't exist or wrong permissions  
**Fix**: 
```bash
# In Dockerfile, ensure:
RUN mkdir -p /app/uploads
RUN chmod 755 /app/uploads
```

### 4. Test BunnyCDN Connection Manually

```bash
# Inside backend container
docker compose exec backend bash

# Test connection
curl -X PUT \
  https://storage.bunnycdn.com/<STORAGE_ZONE>/images/test.txt \
  -H "AccessKey: <YOUR_API_KEY>" \
  -d "test content"

# Should return 201 Created
```

### 5. Verify Image URL Construction

Check `ItemPublic.from_item()` logic in `backend/app/models.py`:

```python
if settings.ENVIRONMENT == "local":
    # Development: use local download endpoint
    url = f"{base_url}/api/v1/images/download/{img.id}"
else:
    # Staging/Production: use CDN URL from img.path
    url = img.path
```

**Expected paths in database**:
- Local: `./uploads/images/uuid.jpg`
- Staging/Prod: `https://storage-zone.b-cdn.net/images/uuid.jpg`

### 6. Deploy Updated Code

After fixing issues, deploy:

```bash
# Rebuild and deploy
docker compose build backend
docker compose up -d backend

# Or push to git and trigger CI/CD
git add .
git commit -m "fix: improve image upload error handling"
git push origin main
```

## Current Changes

✅ Added detailed error logging  
✅ Environment detection (local vs staging/production)  
✅ BunnyCDN error responses now include status and message  
✅ Better exception handling with stack traces  

## Next Steps

1. Deploy updated code to staging
2. Try uploading an image
3. Check backend logs for detailed error message
4. Share the specific error message for further debugging
