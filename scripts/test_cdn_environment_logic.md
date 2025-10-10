# CDN Environment Logic - Testing Guide

## ✅ Changes Applied

Updated `backend/app/core/config.py` so that `bunnycdn_enabled` now:
- **Returns `False` in development** → Always uses local storage
- **Returns `True` in staging/production** → Uses CDN if credentials are set

## Current Configuration

```
Environment: local (development)
BunnyCDN Enabled: False
Upload Dir: /app/uploads
```

## Behavior by Environment

| Environment | CDN Credentials Set? | Result | Storage Location |
|-------------|---------------------|--------|------------------|
| development | ✅ Yes | ❌ CDN Disabled | Local `/app/uploads` |
| development | ❌ No | ❌ CDN Disabled | Local `/app/uploads` |
| staging | ✅ Yes | ✅ CDN Enabled | BunnyCDN |
| staging | ❌ No | ❌ CDN Disabled | Local `/app/uploads` |
| production | ✅ Yes | ✅ CDN Enabled | BunnyCDN |
| production | ❌ No | ❌ CDN Disabled | Local `/app/uploads` |

## Testing the 401 Error on Server

Since development now always uses local storage, to test the CDN credentials and debug the 401 error on your server:

### Option 1: Temporarily Change Environment Variable
```bash
# In docker-compose.override.yml or .env
ENVIRONMENT=staging

# Then restart
docker compose restart backend
```

### Option 2: Test Credentials Directly with curl
```bash
# List storage zone contents
curl -X GET \
  "https://storage.bunnycdn.com/YOUR_STORAGE_ZONE/" \
  -H "AccessKey: YOUR_API_KEY"

# Expected results:
# - 200: Credentials are valid ✅
# - 401: API key is wrong or doesn't have access ❌
# - 404: Storage zone name is wrong ❌
```

### Option 3: Create Test Upload Script
```python
import os
import requests
from dotenv import load_dotenv

load_dotenv()

storage_zone = os.getenv("BUNNYCDN_STORAGE_ZONE")
api_key = os.getenv("BUNNYCDN_API_KEY")

# Test upload
url = f"https://storage.bunnycdn.com/{storage_zone}/test/test.txt"
headers = {"AccessKey": api_key}
data = b"Test file content"

response = requests.put(url, data=data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

## Verifying Configuration

```bash
# Check current environment
docker compose exec backend python -c "from app.core.config import settings; print(f'ENV: {settings.ENVIRONMENT}, CDN: {settings.bunnycdn_enabled}')"

# Expected outputs:
# - development/local: CDN: False
# - staging: CDN: True (if credentials set)
# - production: CDN: True (if credentials set)
```

## Common 401 Causes

1. **Wrong API Key** - Check your `.env` file
2. **Wrong Storage Zone Name** - Verify it matches your BunnyCDN panel
3. **API Key Permissions** - Ensure the key has read/write access
4. **Region Mismatch** - Some keys only work in specific regions

## Code Reference

The logic is in `backend/app/core/config.py`:

```python
@computed_field
def bunnycdn_enabled(self) -> bool:
    """
    Enable CDN only in staging/production environments.
    Development always uses local storage.
    """
    # Never use CDN in development
    if self.ENVIRONMENT == "local":
        return False
    # Use CDN in staging/production if credentials are configured
    return bool(self.BUNNYCDN_STORAGE_ZONE and self.BUNNYCDN_API_KEY)
```

Files that use this setting:
- `backend/app/api/routes/images.py` - Image uploads
- `backend/app/api/routes/models.py` - 3D model uploads
