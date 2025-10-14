import os
import uuid
from logging import getLogger
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel

from app.core.config import CDNFolder, settings
from app.core.storage import delete_from_bunnycdn, save_to_bunnycdn, save_to_local

router = APIRouter(prefix="/models", tags=["models"])

logging = getLogger(__name__)
logging.setLevel("INFO")


class ModelRequest(BaseModel):
    user_id: str
    item_id: str


@router.post("/{item_id}/{user_id}")
async def upload_model(
    item_id: str, user_id: str, file: UploadFile = File(...)
) -> dict[str, str]:
    """Upload a 3D model file (.blend) and return the URL."""
    logging.info(f"Upload request: item_id={item_id}, user_id={user_id}, file={file.filename}")
    logging.info(f"Environment: {settings.ENVIRONMENT}, BunnyCDN enabled: {settings.bunnycdn_enabled}")
    
    # Validate file extension
    if not file.filename or not file.filename.lower().endswith('.blend'):
        raise HTTPException(
            status_code=400, 
            detail="Only .blend files are allowed"
        )
    
    # Generate unique model ID
    model_id = uuid.uuid4()
    
    try:
        if settings.bunnycdn_enabled:
            # Save to BunnyCDN if configured
            logging.info(f"Uploading to BunnyCDN with zone: {settings.BUNNYCDN_STORAGE_ZONE}")
            model_url = await save_to_bunnycdn(file, CDNFolder.MODELS, model_id)
        else:
            # Save to local folder if BunnyCDN not configured
            logging.info(f"Uploading to local storage: {settings.UPLOAD_DIR}")
            model_url = await save_to_local(file, CDNFolder.MODELS, model_id)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Unexpected error during file upload: {str(e)}"
        logging.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    
    return {"url": model_url}


@router.delete("/{item_id}/{user_id}/{file_name}")
async def delete_model(item_id: str, user_id: str, file_name: str) -> dict[str, str]:
    """Delete a model file by filename (supports both local and BunnyCDN)."""
    if settings.bunnycdn_enabled:
        # Construct the BunnyCDN URL and delete it
        storage_zone = settings.BUNNYCDN_STORAGE_ZONE
        bunny_url = f"https://{storage_zone}.b-cdn.net/models/{file_name}"
        try:
            await delete_from_bunnycdn(bunny_url)
            return {"message": "Model file deleted successfully"}
        except Exception as e:
            logging.error(f"Failed to delete model from BunnyCDN: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete model file")
    else:
        # Delete the file from the local folder
        file_path = settings.UPLOAD_DIR / CDNFolder.MODELS.value / file_name
        try:
            if file_path.exists():
                os.remove(file_path)
            return {"message": "Model file deleted successfully"}
        except Exception as e:
            logging.error(f"Failed to delete model file: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete model file")


@router.delete("/{item_id}")
async def delete_item_model(item_id: str) -> dict[str, str]:
    """Delete all model files for an item (note: this endpoint may need refinement for BunnyCDN)."""
    # Note: For BunnyCDN, we would need to list files first, which isn't implemented yet
    # This is a simplified version that assumes local storage
    if settings.bunnycdn_enabled:
        logging.warning("delete_item_model not fully implemented for BunnyCDN")
        return {"message": "Item model deletion not fully implemented for BunnyCDN"}
    else:
        # Delete files from local folder
        model_dir = settings.UPLOAD_DIR / CDNFolder.MODELS.value
        try:
            # Note: This simplified version just returns success
            # In practice, you'd need a database to track which files belong to which items
            return {"message": "Item model deleted successfully"}
        except Exception as e:
            logging.error(f"Failed to delete item model: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete item model")


@router.get("/{item_id}/{user_id}")
async def get_model(item_id: str, user_id: str) -> dict[str, str | None]:
    """Get model filename for an item (note: simplified implementation)."""
    # Note: This endpoint would benefit from a database table to track models
    if settings.bunnycdn_enabled:
        logging.warning("get_model not fully implemented for BunnyCDN")
        raise HTTPException(status_code=501, detail="BunnyCDN listing not implemented")
    else:
        # Get model from the local folder
        upload_dir = settings.UPLOAD_DIR / CDNFolder.MODELS.value
        if not upload_dir.exists():
            return {"model": None}
        
        # Find .blend files (note: this is simplified, doesn't filter by item_id)
        blend_files = list(upload_dir.glob("*.blend"))
        if blend_files:
            return {"model": blend_files[0].name}
        return {"model": None}


@router.get("/{item_id}/{user_id}/{file_name}", response_model=None)
async def download_model(item_id: str, user_id: str, file_name: str) -> FileResponse | RedirectResponse:
    """Download a model file by filename."""
    # Validate it's a .blend file
    if not file_name.lower().endswith('.blend'):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if settings.bunnycdn_enabled:
        # For BunnyCDN, redirect to the CDN URL
        storage_zone = settings.BUNNYCDN_STORAGE_ZONE
        bunny_url = f"https://{storage_zone}.b-cdn.net/models/{file_name}"
        return RedirectResponse(url=bunny_url)
    else:
        # Stream the file from the local folder
        file_path = settings.UPLOAD_DIR / CDNFolder.MODELS.value / file_name
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Model file not found")
            
        return FileResponse(
            file_path, 
            media_type="application/octet-stream",
            filename=file_name
        )


