import os
from logging import getLogger
from pathlib import Path

import requests  # type: ignore
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import CDNFolder, settings

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")

UPLOAD_DIR = "./uploads/images"


class FileRequest(BaseModel):
    user_id: str
    item_id: str


@router.post("/{item_id}/{user_id}")
async def upload_file(
    item_id: str,
    user_id: str,
    file: UploadFile = File(...),
    folder: CDNFolder = Query(CDNFolder.images, description="CDN folder to upload to")
) -> dict[str, str]:
    if settings.bunnycdn_enabled:
        # Save to BunnyCDN if configured
        return {"url": await save_to_bunnycdn(file, folder)}
    else:
        # Save to local folder if BunnyCDN not configured
        return {"url": await save_to_local(file, item_id, user_id, folder)}


@router.delete("/{item_id}/{user_id}/{file_name}")
async def delete_file(item_id: str, user_id: str, file_name: str) -> dict[str, str]:
    if settings.bunnycdn_enabled:
        # Delete the file from BunnyCDN
        raise HTTPException(status_code=501, detail="BunnyCDN deletion not implemented")
    else:
        # Delete the file from the local folder
        file_path = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/{file_name}")
        try:
            os.remove(file_path)
            # Check if the user_id directory is empty and delete it if it is
            user_dir = file_path.parent
            if not any(user_dir.iterdir()):
                user_dir.rmdir()
            return {"message": "File deleted successfully"}
        except Exception as _:
            raise HTTPException(status_code=500, detail="Failed to delete file")


@router.delete("/{item_id}")
async def delete_item_images(item_id: str) -> dict[str, str]:
    if settings.bunnycdn_enabled:
        # Delete the folder from BunnyCDN
        raise HTTPException(status_code=501, detail="BunnyCDN deletion not implemented")
    else:
        # Delete the folder from the local folder
        item_dir = Path(f"{UPLOAD_DIR}/{item_id}")
        try:
            if item_dir.exists() and item_dir.is_dir():
                for user_dir in item_dir.iterdir():
                    if user_dir.is_dir():
                        for file in user_dir.iterdir():
                            file.unlink()
                        user_dir.rmdir()
                item_dir.rmdir()
            return {"message": "Item images deleted successfully"}
        except Exception as _:
            raise HTTPException(status_code=500, detail="Failed to delete item images")


@router.get("/{item_id}/{user_id}")
async def get_files(item_id: str, user_id: str) -> dict[str, str | list[str]]:
    if settings.bunnycdn_enabled:
        # Get files from BunnyCDN
        raise HTTPException(status_code=501, detail="BunnyCDN listing not implemented")
    else:
        # Get files from the local folder
        upload_dir = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}")
        files = [file.name for file in upload_dir.iterdir()]
        return {"files": files}


@router.get("/{item_id}/{user_id}/{file_name}")
async def get_file(item_id: str, user_id: str, file_name: str) -> FileResponse:
    if settings.bunnycdn_enabled:
        # For BunnyCDN, streaming from storage is not implemented here
        raise HTTPException(
            status_code=501, detail="BunnyCDN file streaming not implemented"
        )
    else:
        # Stream the file from the local folder
        file_path = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/{file_name}")
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)


async def save_to_bunnycdn(file: UploadFile, folder: CDNFolder) -> str:
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
        bunny_path = f"{folder.value}/{file.filename}"
        url = f"https://storage.bunnycdn.com/{storage_zone}/{bunny_path}"

        headers = {
            "AccessKey": bunny_api_key,
            "Content-Type": "application/octet-stream",
        }
        # Upload via PUT
        response = requests.put(url, data=content, headers=headers)
        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=500, detail="Failed to upload file to BunnyCDN"
            )

        # Construct a public CDN URL for the uploaded file
        bunny_url = f"https://{storage_zone}.b-cdn.net/{bunny_path}"
        return bunny_url

    except Exception as e:
        logging.error(f"Failed to upload file to BunnyCDN: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")


async def save_to_local(file: UploadFile, item_id: str, user_id: str, folder: CDNFolder) -> str:
    """Save the file to a local folder and return the file's local path."""
    upload_dir = Path(f"./uploads/{folder.value}/{item_id}/{user_id}/")
    upload_dir.mkdir(parents=True, exist_ok=True)

    if file.filename is not None:
        file_path = upload_dir / file.filename

    try:
        with file_path.open("wb") as f:
            f.write(await file.read())
        return str(file_path)
    except Exception as _:
        raise HTTPException(status_code=500, detail="Failed to save file locally")
