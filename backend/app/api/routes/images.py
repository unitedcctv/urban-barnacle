import os
import uuid
from enum import Enum
from logging import getLogger
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core.config import CDNFolder, EntityType, ProducerImageType, settings
from app.core.storage import delete_from_bunnycdn, save_to_bunnycdn, save_to_local
from app.models import (
    ItemImage,
    ImageCreate,
    ImagePublic,
    ImagesPublic,
    ProducerImage,
    ProducerImageCreate,
    ProducerImagePublic,
)

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")

class UploadResponse(BaseModel):
    """Response model for file uploads."""
    path: str
    filename: str


@router.post("/{id}")
async def upload_file(
    session: SessionDep,
    id: str,
    file: UploadFile = File(...),
    entity_type: EntityType = Query(EntityType.ITEM, description="Type of entity: item or producer"),
    image_type: ProducerImageType | None = Query(None, description="Type of producer image: logo or portfolio")
) -> ImagePublic | ProducerImagePublic:
    """Upload an image for items or producers."""
    # Determine folder based on entity type
    folder = CDNFolder.IMAGES_PRODUCER if entity_type == EntityType.PRODUCER else CDNFolder.IMAGES_ITEM
    
    logging.info(f"Upload request: id={id}, file={file.filename}, entity_type={entity_type.value}, folder={folder.value}")
    logging.info(f"Environment: {settings.ENVIRONMENT}, BunnyCDN enabled: {settings.bunnycdn_enabled}")
    
    # Parse id as UUID
    try:
        entity_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format")
    
    # Generate unique file ID
    file_id = uuid.uuid4()
    
    try:
        if settings.bunnycdn_enabled:
            # Save to BunnyCDN if configured
            logging.info(f"Uploading to BunnyCDN with zone: {settings.BUNNYCDN_STORAGE_ZONE}")
            image_path = await save_to_bunnycdn(file, folder, file_id)
        else:
            # Save to local folder if BunnyCDN not configured
            logging.info(f"Uploading to local storage: {settings.UPLOAD_DIR}")
            image_path = await save_to_local(file, folder, file_id)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Unexpected error during file upload: {str(e)}"
        logging.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    
    # Extract filename
    filename = file.filename or "file"
    name_without_ext = Path(filename).stem
    
    # For producer images, create database entry with image_type
    if entity_type == EntityType.PRODUCER:
        if image_type is None:
            raise HTTPException(status_code=400, detail="image_type is required for producer images")
        
        producer_image_create = ProducerImageCreate(
            path=image_path,
            name=name_without_ext,
            image_type=image_type.value,
            producer_id=entity_uuid
        )
        db_producer_image = ProducerImage.model_validate(producer_image_create, update={"id": file_id})
        session.add(db_producer_image)
        session.commit()
        session.refresh(db_producer_image)
        
        return ProducerImagePublic.model_validate(db_producer_image)
    
    # For item images, create database entry
    image_create = ImageCreate(
        path=image_path,
        name=name_without_ext,
        item_id=entity_uuid
    )
    db_image = ItemImage.model_validate(image_create, update={"id": file_id})
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
    db_image = session.get(ItemImage, img_uuid)
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
    statement = select(ItemImage).where(ItemImage.item_id == item_uuid)
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
    
    statement = select(ItemImage).where(ItemImage.item_id == item_uuid)
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
    
    db_image = session.get(ItemImage, img_uuid)
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
    
    db_image = session.get(ItemImage, img_uuid)
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


@router.get("/producer/{producer_id}")
async def get_producer_images(
    session: SessionDep, 
    producer_id: str,
    image_type: ProducerImageType | None = Query(None, description="Filter by image type: logo or portfolio")
) -> list[ProducerImagePublic]:
    """Get all images for a producer, optionally filtered by type."""
    try:
        producer_uuid = uuid.UUID(producer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid producer_id format")
    
    statement = select(ProducerImage).where(ProducerImage.producer_id == producer_uuid)
    
    # Filter by image type if provided
    if image_type:
        statement = statement.where(ProducerImage.image_type == image_type.value)
    
    images = session.exec(statement).all()
    
    return [ProducerImagePublic.model_validate(img) for img in images]


