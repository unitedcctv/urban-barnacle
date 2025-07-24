import os
from logging import getLogger
from pathlib import Path

import requests  # type: ignore
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/models", tags=["models"])

logging = getLogger(__name__)
logging.setLevel("INFO")

UPLOAD_DIR = "./uploads/models"


class ModelRequest(BaseModel):
    user_id: str
    item_id: str


@router.post("/{item_id}/{user_id}")
async def upload_model(
    item_id: str, user_id: str, file: UploadFile = File(...)
) -> dict[str, str]:
    # Validate file extension
    if not file.filename or not file.filename.lower().endswith('.blend'):
        raise HTTPException(
            status_code=400, 
            detail="Only .blend files are allowed"
        )
    
    # Check if a model already exists for this item and delete it first
    await delete_item_model(item_id)
    
    if settings.ENVIRONMENT == "production":
        # Save to BunnyCDN in production
        return {"url": await save_to_bunnycdn(file)}
    else:
        # Save to local folder in development
        return {"url": await save_to_local(file, item_id, user_id)}


@router.delete("/{item_id}/{user_id}/{file_name}")
async def delete_model(item_id: str, user_id: str, file_name: str) -> dict[str, str]:
    if settings.ENVIRONMENT == "production":
        # Delete the file from BunnyCDN in production
        raise HTTPException(status_code=501, detail="BunnyCDN deletion not implemented")
    else:
        # Delete the file from the local folder in development
        file_path = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/{file_name}")
        try:
            if file_path.exists():
                os.remove(file_path)
                # Check if the user_id directory is empty and delete it if it is
                user_dir = file_path.parent
                if not any(user_dir.iterdir()):
                    user_dir.rmdir()
                    # Check if the item_id directory is empty and delete it if it is
                    item_dir = user_dir.parent
                    if not any(item_dir.iterdir()):
                        item_dir.rmdir()
            return {"message": "Model file deleted successfully"}
        except Exception as e:
            logging.error(f"Failed to delete model file: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete model file")


@router.delete("/{item_id}")
async def delete_item_model(item_id: str) -> dict[str, str]:
    if settings.ENVIRONMENT == "production":
        # Delete the folder from BunnyCDN in production
        raise HTTPException(status_code=501, detail="BunnyCDN deletion not implemented")
    else:
        # Delete the folder from the local folder in development
        item_dir = Path(f"{UPLOAD_DIR}/{item_id}")
        try:
            if item_dir.exists() and item_dir.is_dir():
                for user_dir in item_dir.iterdir():
                    if user_dir.is_dir():
                        for file in user_dir.iterdir():
                            file.unlink()
                        user_dir.rmdir()
                item_dir.rmdir()
            return {"message": "Item model deleted successfully"}
        except Exception as e:
            logging.error(f"Failed to delete item model: {e}")
            raise HTTPException(status_code=500, detail="Failed to delete item model")


@router.get("/{item_id}/{user_id}")
async def get_model(item_id: str, user_id: str) -> dict[str, str | None]:
    if settings.ENVIRONMENT == "production":
        # Get model from BunnyCDN in production
        raise HTTPException(status_code=501, detail="BunnyCDN listing not implemented")
    else:
        # Get model from the local folder in development
        upload_dir = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}")
        if not upload_dir.exists():
            return {"model": None}
        
        # Find the first .blend file (should only be one)
        blend_files = list(upload_dir.glob("*.blend"))
        if blend_files:
            return {"model": blend_files[0].name}
        return {"model": None}


@router.get("/{item_id}/{user_id}/{file_name}")
async def download_model(item_id: str, user_id: str, file_name: str) -> FileResponse:
    if settings.ENVIRONMENT == "production":
        # For BunnyCDN, streaming from storage is not implemented here
        raise HTTPException(
            status_code=501, detail="BunnyCDN file streaming not implemented"
        )
    else:
        # Stream the file from the local folder in development
        file_path = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/{file_name}")
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Model file not found")
        
        # Validate it's a .blend file
        if not file_name.lower().endswith('.blend'):
            raise HTTPException(status_code=400, detail="Invalid file type")
            
        return FileResponse(
            file_path, 
            media_type="application/octet-stream",
            filename=file_name
        )


async def save_to_bunnycdn(file: UploadFile) -> str:
    """Save the model file to BunnyCDN storage and return the accessible URL."""
    logging.info("Uploading model file to BunnyCDN")
    # Adjust these to match your BunnyCDN config:
    storage_zone = "your-storage-zone"
    bunny_api_key = "your-api-key"
    folder_name = "models"

    try:
        # Read file content
        content = await file.read()
        bunny_path = f"{folder_name}/{file.filename}"
        url = f"https://storage.bunnycdn.com/{storage_zone}/{bunny_path}"

        headers = {
            "AccessKey": bunny_api_key,
            "Content-Type": "application/octet-stream",
        }
        # Upload via PUT
        response = requests.put(url, data=content, headers=headers)
        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=500, detail="Failed to upload model file to BunnyCDN"
            )

        # Construct a public CDN URL for the uploaded file
        bunny_url = f"https://{storage_zone}.b-cdn.net/{bunny_path}"
        return bunny_url

    except Exception as e:
        logging.error(f"Failed to upload model file to BunnyCDN: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload model file")


async def save_to_local(file: UploadFile, item_id: str, user_id: str) -> str:
    """Save the model file to a local folder and return the file's local path."""
    upload_dir = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/")
    upload_dir.mkdir(parents=True, exist_ok=True)

    if file.filename is not None:
        file_path = upload_dir / file.filename

    try:
        with file_path.open("wb") as f:
            f.write(await file.read())
        return str(file_path)
    except Exception as e:
        logging.error(f"Failed to save model file locally: {e}")
        raise HTTPException(status_code=500, detail="Failed to save model file locally")
