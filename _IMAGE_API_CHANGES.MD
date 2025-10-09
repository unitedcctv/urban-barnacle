# Image API Refactoring - Changes Summary

## Overview
The image handling system has been completely refactored to use UUID-based identification and database storage with proper tracking.

## Database Changes

### New Image Table
Created a new `image` table with the following fields:
- `id` (UUID, primary key) - Auto-generated UUID for each image
- `path` (string, max 500) - Full path or URL to the image file
- `name` (string, max 255) - Filename without extension
- `item_id` (UUID, foreign key) - References the item this image belongs to
- `created_at` (datetime) - Timestamp when image was uploaded

### Migration
- Created migration file: `7d8e9f0a1b2c_add_image_table.py`
- Run `alembic upgrade head` to apply the migration

## API Changes

### Upload Image
**Old:** `POST /api/v1/images/{item_id}/{user_id}`
**New:** `POST /api/v1/images/{item_id}`

**Changes:**
- Removed `user_id` from path (authentication handled via session)
- Now returns `ImagePublic` object instead of just URL
- Creates database entry for tracking

**Response:**
```json
{
  "id": "uuid",
  "path": "file_path_or_url",
  "name": "filename_without_extension",
  "item_id": "uuid",
  "created_at": "timestamp"
}
```

### Get Images for Item
**Old:** `GET /api/v1/images/{item_id}/{user_id}`
**New:** `GET /api/v1/images/item/{item_id}`

**Changes:**
- Removed `user_id` from path
- Returns paginated list of images with metadata

**Response:**
```json
{
  "data": [ImagePublic],
  "count": 5
}
```

### Get Single Image
**New:** `GET /api/v1/images/{image_id}`

Returns metadata for a specific image by its UUID.

### Download Image
**New:** `GET /api/v1/images/download/{image_id}`

Downloads the actual image file:
- For local storage: Returns the file directly
- For BunnyCDN: Redirects to the CDN URL

### Delete Image
**Old:** `DELETE /api/v1/images/{item_id}/{user_id}/{file_name}`
**New:** `DELETE /api/v1/images/{image_id}`

**Changes:**
- Now deletes by image UUID instead of path parameters
- Removes both file and database entry

### Delete All Item Images
**Old:** `DELETE /api/v1/images/{item_id}`
**New:** `DELETE /api/v1/images/item/{item_id}`

**Changes:**
- Path changed to avoid conflict with single image deletion
- Deletes all images associated with an item

## Storage Changes

### Local Storage
- **Location:** `./uploads/images/{folder_name}/`
- **Filename:** Uses UUID with original extension (e.g., `550e8400-e29b-41d4-a716-446655440000.jpg`)
- **Structure:** Flat directory structure per folder type

### BunnyCDN Storage
- **Path:** `{folder_name}/{uuid}.{extension}`
- **URL:** `https://{storage_zone}.b-cdn.net/{folder_name}/{uuid}.{extension}`
- **Filename:** Same UUID-based naming as local storage

### Key Improvements
1. Both local and BunnyCDN now use the same UUID-based naming scheme
2. Files are tracked in the database regardless of storage method
3. No more nested directory structures (item_id/user_id)
4. Easier to migrate between storage backends

## Frontend Changes Required

### SDK Regeneration
The frontend SDK (`frontend/src/client/sdk.gen.ts`) needs to be regenerated to reflect the new API endpoints.

**Command:**
```bash
cd frontend
npm run generate-client
```

### ItemPublic Model Update
The `ItemPublic` response now includes an `image_urls` field that contains ready-to-use URLs for all images:

```typescript
interface ItemPublic {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  images?: string; // Legacy comma-separated field (deprecated)
  image_urls: string[]; // NEW: Array of ready-to-use image URLs
  // ... other fields
}
```

### Code Updates
Any frontend code using the old API structure will need updates:

#### Image Upload - Old vs New

**Old:**
```typescript
await ImagesService.imagesUploadFile({
  itemId: itemId,
  userId: userId,
  formData: { file }
})
```

**New:**
```typescript
const image = await ImagesService.imagesUploadFile({
  itemId: itemId,
  formData: { file }
})
// Now you have:
// - image.id (UUID)
// - image.path (file path or CDN URL)
// - image.name (filename without extension)
// - image.item_id (UUID)
// - image.created_at (timestamp)
```

#### Display Images - Old vs New

**Old:**
```typescript
// Manually construct URLs from item.images string
const images_url = "http://localhost:8000/api/v1/images/";
const imageUrls = item.images
  ?.split(",")
  .map(img => `${images_url}${item.id}/${item.owner_id}/${img.trim()}`)
  .filter(Boolean);
```

**New:**
```typescript
// Use the provided image_urls array directly
const imageUrls = item.image_urls || [];

// Images are already fully qualified URLs, ready to use:
// - For CDN: https://zone.b-cdn.net/images/{uuid}.jpg
// - For local: http://localhost:8000/api/v1/images/download/{uuid}
```

#### Delete Image - Old vs New

**Old:**
```typescript
await ImagesService.imagesDeleteFile({
  itemId: itemId,
  userId: userId,
  fileName: "image.jpg"
})
```

**New:**
```typescript
// Delete by image UUID
await ImagesService.imagesDeleteFile({
  imageId: imageId
})
```

#### Get Item Images - Old vs New

**Old:**
```typescript
const result = await ImagesService.imagesGetFiles({
  itemId: itemId,
  userId: userId
})
// Returns: { files: string[] } - just filenames
```

**New:**
```typescript
const result = await ImagesService.imagesGetItemImages({
  itemId: itemId
})
// Returns: { data: ImagePublic[], count: number }
// Each ImagePublic has id, path, name, item_id, created_at
```

### Example: Update ItemShow Component

**Before:**
```typescript
import { images_url } from "../../utils";

const ItemShow = ({ item }: { item: ItemPublic }) => {
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    if (item.images) {
      const firstFileName = item.images.split(",")[0]?.trim();
      if (firstFileName) {
        const src = images_url.concat(item.id, "/", item.owner_id, "/", firstFileName);
        setImageSrc(src);
      }
    }
  }, [item]);

  return <img src={imageSrc} alt={item.title} />;
};
```

**After:**
```typescript
const ItemShow = ({ item }: { item: ItemPublic }) => {
  const firstImageUrl = item.image_urls?.[0] || "";

  return <img src={firstImageUrl} alt={item.title} />;
};
```

### Files to Update

The following frontend files reference the old image API:

1. **`frontend/src/utils.ts`**
   - Remove or deprecate `images_url` export
   
2. **`frontend/src/routes/_layout/item.tsx`**
   - Replace manual URL construction with `item.image_urls`
   
3. **`frontend/src/routes/_layout/index.tsx`**
   - Replace manual URL construction with `item.image_urls`
   
4. **`frontend/src/components/Items/ItemShow.tsx`**
   - Replace manual URL construction with `item.image_urls`

## Migration Guide for Existing Data

If you have existing images, you'll need to:
1. Create database entries for existing images
2. Optionally rename files to UUID-based naming
3. Update any references to old paths

## Benefits

1. **Better Tracking:** All images tracked in database
2. **Simpler API:** UUID-based identification instead of path-based
3. **Consistency:** Local and CDN storage work the same way
4. **Scalability:** Easier to add features like image metadata, thumbnails, etc.
5. **Security:** No file paths exposed in URLs
6. **Flexibility:** Easy to add image processing, compression, etc.

## Testing with cURL

### Upload an Image
```bash
# Login first
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=changethis" | jq -r '.access_token')

# Upload image
curl -X POST "http://localhost:8000/api/v1/images/{item_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"

# Response:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "path": "./uploads/images/images/550e8400-e29b-41d4-a716-446655440000.jpg",
#   "name": "image",
#   "item_id": "...",
#   "created_at": "2025-10-09T18:30:00"
# }
```

### Get Images for an Item
```bash
curl -X GET "http://localhost:8000/api/v1/images/item/{item_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Image Metadata
```bash
curl -X GET "http://localhost:8000/api/v1/images/{image_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Download Image
```bash
curl -X GET "http://localhost:8000/api/v1/images/download/{image_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_image.jpg
```

### Delete Image
```bash
curl -X DELETE "http://localhost:8000/api/v1/images/{image_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete All Item Images
```bash
curl -X DELETE "http://localhost:8000/api/v1/images/item/{item_id}" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Item with Image URLs
```bash
curl -X GET "http://localhost:8000/api/v1/items/{item_id}" \
  -H "Authorization: Bearer $TOKEN"

# Response includes image_urls array:
# {
#   "item": {
#     "id": "...",
#     "title": "My Item",
#     "image_urls": [
#       "http://localhost:8000/api/v1/images/download/550e8400-e29b-41d4-a716-446655440000",
#       "http://localhost:8000/api/v1/images/download/660e8400-e29b-41d4-a716-446655440001"
#     ],
#     ...
#   },
#   "can_edit": true
# }
```

## Python Test Script

A complete Python test script is available at `backend/test_image_api.py`. Run it with:

```bash
cd backend
python test_image_api.py
```

Make sure to update the EMAIL and PASSWORD variables in the script first.

## Notes

- The `FileRequest` model in `images.py` is now unused and can be removed
- Image uploads now require database session dependency
- All UUIDs are validated before processing
- Error handling improved with better logging
- Images are automatically deleted from storage when deleted from database
- When an item is deleted, all associated images are cascade deleted
