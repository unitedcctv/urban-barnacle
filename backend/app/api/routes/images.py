import os
import uuid
from logging import getLogger
from pathlib import Path

import requests  # type: ignore
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core.config import CDNFolder, settings
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
        file_path = Path(db_image.path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)


async def save_to_bunnycdn(file: UploadFile, folder: CDNFolder, image_id: uuid.UUID) -> str:
    """Save the file to BunnyCDN storage and return the accessible URL."""
    logging.info(f"Uploading file to BunnyCDN folder: {folder.value}")
    
    # Check if BunnyCDN is configured
    if not settings.bunnycdn_enabled:
        raise HTTPException(
            status_code=500, 
            detail="BunnyCDN is not configured. Set BUNNYCDN_STORAGE_ZONE and BUNNYCDN_API_KEY environment variables."
        )
    
    storage_zone = settings.BUNNYCDN_STORAGE_ZONE
    bunny_api_key = settings.BUNNYCDN_API_KEY

    try:
        # Read file content
        content = await file.read()
        
        # Use UUID as filename with original extension
        original_filename = file.filename or "image"
        file_extension = Path(original_filename).suffix
        new_filename = f"{image_id}{file_extension}"
        
        bunny_path = f"{folder.value}/{new_filename}"
        url = f"https://storage.bunnycdn.com/{storage_zone}/{bunny_path}"

        headers = {
            "AccessKey": bunny_api_key,
            "Content-Type": "application/octet-stream",
        }
        # Upload via PUT
        response = requests.put(url, data=content, headers=headers)
        if response.status_code not in (200, 201):
            error_detail = f"BunnyCDN upload failed with status {response.status_code}: {response.text}"
            logging.error(error_detail)
            raise HTTPException(
                status_code=500, detail=error_detail
            )

        logging.info(f"Successfully uploaded to BunnyCDN: {bunny_path}")
        # Construct a public CDN URL for the uploaded file
        bunny_url = f"https://{storage_zone}.b-cdn.net/{bunny_path}"
        return bunny_url

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_detail = f"Failed to upload file to BunnyCDN: {str(e)}"
        logging.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)


async def save_to_local(file: UploadFile, folder: CDNFolder, image_id: uuid.UUID) -> str:
    """Save the file to a local folder and return the file's local path."""
    upload_dir = settings.UPLOAD_DIR / folder.value
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Use UUID as filename with original extension
    original_filename = file.filename or "image"
    file_extension = Path(original_filename).suffix
    new_filename = f"{image_id}{file_extension}"
    file_path = upload_dir / new_filename
    
    # Get absolute path for logging
    abs_path = file_path.resolve()
    logging.info(f"Saving file to: {abs_path}")

    try:
        with file_path.open("wb") as f:
            content = await file.read()
            f.write(content)
        logging.info(f"Successfully saved file: {abs_path} ({len(content)} bytes)")
        return str(file_path)
    except Exception as e:
        logging.error(f"Failed to save file locally to {abs_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file locally: {str(e)}")


async def delete_from_bunnycdn(path: str) -> None:
    """Delete a file from BunnyCDN storage."""
    if not settings.bunnycdn_enabled:
        raise HTTPException(
            status_code=500, 
            detail="BunnyCDN is not configured."
        )
    
    storage_zone = settings.BUNNYCDN_STORAGE_ZONE
    bunny_api_key = settings.BUNNYCDN_API_KEY
    
    # Extract the path from the URL
    # URL format: https://{storage_zone}.b-cdn.net/{path}
    if path.startswith("https://"):
        # Extract path after storage zone
        parts = path.split(".b-cdn.net/")
        if len(parts) == 2:
            bunny_path = parts[1]
        else:
            raise HTTPException(status_code=400, detail="Invalid BunnyCDN URL format")
    else:
        bunny_path = path
    
    url = f"https://storage.bunnycdn.com/{storage_zone}/{bunny_path}"
    headers = {"AccessKey": bunny_api_key}
    
    try:
        response = requests.delete(url, headers=headers)
        if response.status_code not in (200, 204):
            logging.error(f"Failed to delete from BunnyCDN: {response.status_code}")
            raise HTTPException(
                status_code=500, detail="Failed to delete file from BunnyCDN"
            )
    except Exception as e:
        logging.error(f"Failed to delete from BunnyCDN: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file from BunnyCDN")
