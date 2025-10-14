import os
import uuid
from logging import getLogger
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core.config import CDNFolder, settings
from app.core.storage import delete_from_bunnycdn, save_to_bunnycdn, save_to_local
from app.models import Image, ImageCreate, ImagePublic, ImagesPublic

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")


@router.post("/{item_id}")
async def upload_file(
    session: SessionDep,
    item_id: str,
    file: UploadFile = File(...),
    folder: CDNFolder = Query(CDNFolder.IMAGES, description="CDN folder to upload to")
) -> ImagePublic:
    """Upload an image and create a database entry."""
    logging.info(f"Upload request: item_id={item_id}, file={file.filename}, folder={folder.value}")
    logging.info(f"Environment: {settings.ENVIRONMENT}, BunnyCDN enabled: {settings.bunnycdn_enabled}")
    
    # Parse item_id as UUID
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item_id format")
    
    # Generate unique image ID
    image_id = uuid.uuid4()
    
    try:
        if settings.bunnycdn_enabled:
            # Save to BunnyCDN if configured
            logging.info(f"Uploading to BunnyCDN with zone: {settings.BUNNYCDN_STORAGE_ZONE}")
            image_path = await save_to_bunnycdn(file, folder, image_id)
        else:
            # Save to local folder if BunnyCDN not configured
            logging.info(f"Uploading to local storage: {settings.UPLOAD_DIR}")
            image_path = await save_to_local(file, folder, image_id)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Unexpected error during file upload: {str(e)}"
        logging.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    
    # Extract filename without extension
    filename = file.filename or "image"
    name_without_ext = Path(filename).stem
    
    # Create database entry
    image_create = ImageCreate(
        path=image_path,
        name=name_without_ext,
        item_id=item_uuid
    )
    db_image = Image.model_validate(image_create, update={"id": image_id})
    session.add(db_image)
    session.commit()
    session.refresh(db_image)
    
    return ImagePublic.model_validate(db_image)


@router.delete("/{image_id}")
async def delete_file(session: SessionDep, image_id: str) -> dict[str, str]:
    """Delete an image by its ID."""
    try:
        img_uuid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image_id format")
    
    # Get image from database
    db_image = session.get(Image, img_uuid)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if settings.bunnycdn_enabled:
        # Delete the file from BunnyCDN
        await delete_from_bunnycdn(db_image.path)
    else:
        # Delete the file from the local folder
        # Path is in format: http://localhost:8000/uploads/images/filename.webp
        # Extract the relative path from the URL
        if db_image.path.startswith("http"):
            # Parse URL to get path: /uploads/images/filename.webp
            from urllib.parse import urlparse
            parsed = urlparse(db_image.path)
            relative_path = parsed.path.removeprefix("/uploads/")
            file_path = settings.UPLOAD_DIR / relative_path
        elif db_image.path.startswith("/uploads/"):
            # Legacy format: /uploads/images/filename.webp
            relative_path = db_image.path.removeprefix("/uploads/")
            file_path = settings.UPLOAD_DIR / relative_path
        else:
            # Very old legacy format: absolute path
            file_path = Path(db_image.path)
        
        try:
            if file_path.exists():
                os.remove(file_path)
        except Exception as e:
            logging.error(f"Failed to delete file {file_path}: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete file")
    
    # Delete database entry
    session.delete(db_image)
    session.commit()
    
    return {"message": "Image deleted successfully"}


@router.delete("/item/{item_id}")
async def delete_item_images(session: SessionDep, item_id: str) -> dict[str, str]:
    """Delete all images for an item."""
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item_id format")
    
    # Get all images for this item
    statement = select(Image).where(Image.item_id == item_uuid)
    images = session.exec(statement).all()
    
    deleted_count = 0
    for db_image in images:
        if settings.bunnycdn_enabled:
            # Delete from BunnyCDN
            try:
                await delete_from_bunnycdn(db_image.path)
            except Exception as e:
                logging.error(f"Failed to delete from BunnyCDN: {e}")
        else:
            # Delete from local folder
            # Path is in format: http://localhost:8000/uploads/images/filename.webp
            # Extract the relative path from the URL
            if db_image.path.startswith("http"):
                # Parse URL to get path: /uploads/images/filename.webp
                from urllib.parse import urlparse
                parsed = urlparse(db_image.path)
                relative_path = parsed.path.removeprefix("/uploads/")
                file_path = settings.UPLOAD_DIR / relative_path
            elif db_image.path.startswith("/uploads/"):
                # Legacy format: /uploads/images/filename.webp
                relative_path = db_image.path.removeprefix("/uploads/")
                file_path = settings.UPLOAD_DIR / relative_path
            else:
                # Very old legacy format: absolute path
                file_path = Path(db_image.path)
            
            try:
                if file_path.exists():
                    os.remove(file_path)
            except Exception as e:
                logging.error(f"Failed to delete file {file_path}: {e}")
        
        # Delete database entry
        session.delete(db_image)
        deleted_count += 1
    
    session.commit()
    
    return {"message": f"{deleted_count} images deleted successfully"}


@router.get("/item/{item_id}")
async def get_item_images(session: SessionDep, item_id: str) -> ImagesPublic:
    """Get all images for an item."""
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item_id format")
    
    statement = select(Image).where(Image.item_id == item_uuid)
    images = session.exec(statement).all()
    
    return ImagesPublic(
        data=[ImagePublic.model_validate(img) for img in images],
        count=len(images)
    )


@router.get("/{image_id}")
async def get_image(session: SessionDep, image_id: str) -> ImagePublic:
    """Get image metadata by ID."""
    try:
        img_uuid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image_id format")
    
    db_image = session.get(Image, img_uuid)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return ImagePublic.model_validate(db_image)


@router.get("/download/{image_id}")
async def download_image(session: SessionDep, image_id: str) -> FileResponse:
    """Download image file by ID."""
    try:
        img_uuid = uuid.UUID(image_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image_id format")
    
    db_image = session.get(Image, img_uuid)
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if settings.bunnycdn_enabled:
        # For BunnyCDN, redirect to the URL
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=db_image.path)
    else:
        # Stream the file from the local folder
        # Path is in format: http://localhost:8000/uploads/images/filename.webp
        # Extract the relative path from the URL
        if db_image.path.startswith("http"):
            # Parse URL to get path: /uploads/images/filename.webp
            from urllib.parse import urlparse
            parsed = urlparse(db_image.path)
            relative_path = parsed.path.removeprefix("/uploads/")
            file_path = settings.UPLOAD_DIR / relative_path
        elif db_image.path.startswith("/uploads/"):
            # Legacy format: /uploads/images/filename.webp
            relative_path = db_image.path.removeprefix("/uploads/")
            file_path = settings.UPLOAD_DIR / relative_path
        else:
            # Very old legacy format: absolute path
            file_path = Path(db_image.path)
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)


