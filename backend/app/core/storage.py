"""
Shared storage utilities for uploading and deleting files to BunnyCDN and local storage.
"""
import uuid
from logging import getLogger
from pathlib import Path

import requests  # type: ignore
from fastapi import HTTPException, UploadFile

from app.core.config import CDNFolder, settings

logger = getLogger(__name__)
logger.setLevel("INFO")


async def save_to_bunnycdn(file: UploadFile, folder: CDNFolder, file_id: uuid.UUID) -> str:
    """Save the file to BunnyCDN storage and return the accessible URL."""
    logger.info(f"Uploading file to BunnyCDN folder: {folder.value}")
    
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
        original_filename = file.filename or "file"
        file_extension = Path(original_filename).suffix
        new_filename = f"{file_id}{file_extension}"
        
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
            logger.error(error_detail)
            raise HTTPException(
                status_code=500, detail=error_detail
            )

        logger.info(f"Successfully uploaded to BunnyCDN: {bunny_path}")
        # Construct a public CDN URL for the uploaded file
        bunny_url = f"https://{storage_zone}.b-cdn.net/{bunny_path}"
        return bunny_url

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_detail = f"Failed to upload file to BunnyCDN: {str(e)}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)


async def save_to_local(file: UploadFile, folder: CDNFolder, file_id: uuid.UUID) -> str:
    """Save the file to a local folder and return a web-accessible relative path."""
    upload_dir = settings.UPLOAD_DIR / folder.value
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Use UUID as filename with original extension
    original_filename = file.filename or "file"
    file_extension = Path(original_filename).suffix
    new_filename = f"{file_id}{file_extension}"
    file_path = upload_dir / new_filename
    
    # Get absolute path for logging
    abs_path = file_path.resolve()
    logger.info(f"Saving file to: {abs_path}")

    try:
        with file_path.open("wb") as f:
            content = await file.read()
            f.write(content)
        logger.info(f"Successfully saved file: {abs_path} ({len(content)} bytes)")
        # Return full backend URL so frontend can access the file
        # Format: http://localhost:8000/uploads/{folder}/{filename}
        return f"{settings.BACKEND_HOST}/uploads/{folder.value}/{new_filename}"
    except Exception as e:
        logger.error(f"Failed to save file locally to {abs_path}: {e}")
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
            logger.error(f"Failed to delete from BunnyCDN: {response.status_code}")
            raise HTTPException(
                status_code=500, detail="Failed to delete file from BunnyCDN"
            )
        logger.info(f"Successfully deleted from BunnyCDN: {bunny_path}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete from BunnyCDN: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file from BunnyCDN")
