# Image System Refactoring - Deployment Checklist

## Pre-Deployment Checklist

### Backend Changes
- [x] ✅ Created `Image` database model with UUID, path, name, item_id
- [x] ✅ Updated `Item` model with `item_images` relationship
- [x] ✅ Enhanced `ItemPublic` with `image_urls` field
- [x] ✅ Refactored image routes to use UUID-based identification
- [x] ✅ Updated items routes to return image URLs
- [x] ✅ Created database migration for Image table
- [x] ✅ Implemented cascade delete for images
- [x] ✅ Removed unused `FileRequest` model
- [x] ✅ Added proper error handling and logging

### Storage Functions
- [x] ✅ `save_to_local()` - Uses UUID filename, saves to backend directory
- [x] ✅ `save_to_bunnycdn()` - Uses UUID filename, uploads to CDN
- [x] ✅ `delete_from_bunnycdn()` - Deletes from CDN storage
- [x] ✅ Both functions create database entries
- [x] ✅ Both functions use identical naming scheme

### Documentation
- [x] ✅ `IMAGE_API_CHANGES.md` - Complete API documentation
- [x] ✅ `IMAGE_REFACTORING_SUMMARY.md` - Summary of changes
- [x] ✅ `test_image_api.py` - Python test script
- [x] ✅ `DEPLOYMENT_CHECKLIST.md` - This checklist

## Deployment Steps

### Step 1: Database Migration
```bash
cd backend

# Check current migration status
alembic current

# Run migration to add Image table
alembic upgrade head

# Verify migration
alembic current
# Should show: 7d8e9f0a1b2c (head)
```

### Step 2: Backend Restart
```bash
# For local development
# Stop the backend server (Ctrl+C)
# Restart it

# For Docker
docker-compose restart backend

# For production (example)
systemctl restart urban-barnacle-backend
```

### Step 3: Test Backend API
```bash
# Option 1: Run test script
cd backend
python test_image_api.py

# Option 2: Test with cURL
# See IMAGE_API_CHANGES.md for cURL examples
```

### Step 4: Frontend Updates
```bash
cd frontend

# Regenerate API client
npm run generate-client

# Update components (see list below)
# Test locally
npm run dev
```

### Step 5: Deploy Frontend
```bash
# Build production bundle
npm run build

# Deploy to your hosting
# (deploy process depends on your setup)
```

## Frontend Files to Update

### Required Changes
1. **`frontend/src/routes/_layout/item.tsx`**
   - [ ] Replace image URL construction with `item.image_urls`
   - [ ] Remove `images_url` import

2. **`frontend/src/routes/_layout/index.tsx`**
   - [ ] Replace image URL construction with `item.image_urls`
   - [ ] Remove `images_url` import

3. **`frontend/src/components/Items/ItemShow.tsx`**
   - [ ] Replace image URL construction with `item.image_urls`
   - [ ] Remove `images_url` import

### Optional Changes
4. **`frontend/src/utils.ts`**
   - [ ] Mark `images_url` as deprecated (or remove if not used elsewhere)

## Verification Steps

### 1. Database Verification
```sql
-- Check Image table exists
SELECT * FROM image LIMIT 1;

-- Check foreign key constraint
SELECT 
    constraint_name, 
    table_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'image';
```

### 2. API Testing
- [ ] Can upload an image: `POST /api/v1/images/{item_id}`
- [ ] Can list item images: `GET /api/v1/images/item/{item_id}`
- [ ] Can get image metadata: `GET /api/v1/images/{image_id}`
- [ ] Can download image: `GET /api/v1/images/download/{image_id}`
- [ ] Can delete image: `DELETE /api/v1/images/{image_id}`
- [ ] Item endpoint returns `image_urls`: `GET /api/v1/items/{item_id}`

### 3. Storage Testing

#### Local Storage
- [ ] Images saved to `./uploads/images/images/{uuid}.ext`
- [ ] Files use UUID naming
- [ ] Files are deleted when image record is deleted

#### BunnyCDN (if enabled)
- [ ] Images uploaded to CDN with UUID naming
- [ ] CDN URLs are stored in database
- [ ] Images are deleted from CDN when record is deleted
- [ ] Item responses include full CDN URLs

### 4. Frontend Testing
- [ ] Items display images correctly
- [ ] Image upload works
- [ ] Image URLs are properly formatted
- [ ] Works with both local and CDN storage
- [ ] No console errors

### 5. Edge Cases
- [ ] Deleting an item deletes all its images (cascade)
- [ ] Invalid UUIDs are rejected with 400 error
- [ ] Missing images return 404
- [ ] Unauthorized access is blocked
- [ ] File upload size limits are respected

## Rollback Plan

If issues arise, you can rollback:

### Database Rollback
```bash
cd backend
alembic downgrade -1
```
This will drop the `image` table.

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout <previous-commit-hash>
```

### Notes on Rollback
- Old image URLs will continue to work if files weren't moved
- The `images` field in Item table is still present
- Frontend can continue using old image URL construction

## Post-Deployment Monitoring

### Metrics to Watch
- [ ] Image upload success rate
- [ ] Image retrieval response times
- [ ] Storage usage (disk or CDN)
- [ ] Database query performance
- [ ] Error rates in logs

### Log Monitoring
```bash
# Check for image-related errors
grep "image" backend.log | grep -i error

# Check for failed uploads
grep "Failed to upload" backend.log

# Check for BunnyCDN issues (if applicable)
grep "BunnyCDN" backend.log | grep -i error
```

## Common Issues & Solutions

### Issue: Migration Fails
**Solution:**
```bash
# Check current state
alembic current

# Check for pending migrations
alembic heads

# Force migration
alembic stamp head
alembic upgrade head
```

### Issue: Images Not Displaying in Frontend
**Solution:**
1. Check if `image_urls` field is present in API response
2. Verify frontend SDK was regenerated
3. Check browser console for CORS or 404 errors
4. Ensure base URL is correct in `ItemPublic.from_item()`

### Issue: CDN Upload Fails
**Solution:**
1. Verify `BUNNYCDN_STORAGE_ZONE` and `BUNNYCDN_API_KEY` are set
2. Check CDN storage zone is accessible
3. Verify CDN API key has write permissions
4. Check backend logs for detailed error

### Issue: Images Not Deleted
**Solution:**
1. Verify cascade delete in foreign key constraint
2. Check file permissions for local storage
3. For CDN, verify API key has delete permissions
4. Check backend logs for deletion errors

## Environment Variables

Ensure these are set (if using BunnyCDN):
```bash
BUNNYCDN_STORAGE_ZONE=your-storage-zone
BUNNYCDN_API_KEY=your-api-key
```

Local storage doesn't require additional configuration.

## Success Criteria

✅ Migration completes without errors
✅ All API endpoints return expected responses
✅ Images upload successfully
✅ Images display correctly in frontend
✅ Images are deleted when items are deleted
✅ No console errors in browser
✅ No errors in backend logs
✅ Storage (local or CDN) is working correctly

## Deployment Sign-Off

- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Database migrated successfully
- [ ] All endpoints verified
- [ ] Storage working correctly
- [ ] Frontend displaying images
- [ ] No critical errors in logs
- [ ] Monitoring in place

**Deployed by:** ___________________
**Date:** ___________________
**Environment:** [ ] Development [ ] Staging [ ] Production
**Notes:** ___________________

---

## Quick Reference

### New API Endpoints
- `POST /api/v1/images/{item_id}` - Upload image
- `GET /api/v1/images/item/{item_id}` - List images
- `GET /api/v1/images/{image_id}` - Get image metadata
- `GET /api/v1/images/download/{image_id}` - Download image
- `DELETE /api/v1/images/{image_id}` - Delete image
- `DELETE /api/v1/images/item/{item_id}` - Delete all images

### Key Changes
- Images now identified by UUID instead of filename
- All images tracked in database
- Item responses include `image_urls` array
- Local and CDN storage use same UUID naming
- Cascade delete: item deletion removes all images

### Support
For issues or questions, refer to:
- `IMAGE_API_CHANGES.md` - Complete API documentation
- `IMAGE_REFACTORING_SUMMARY.md` - Change summary
- `test_image_api.py` - Working examples
