import os
from logging import getLogger
from pathlib import Path

import boto3
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")

UPLOAD_DIR = "./uploads"

class FileRequest(BaseModel):
    user_id: str
    item_id: str

@router.post("/{item_id}/{user_id}")
async def upload_file(item_id: str, user_id: str, file: UploadFile = File(...)) -> dict:
    if settings.ENVIRONMENT == "production":
        # Save to S3 in production
        return {"url": await save_to_s3(file)}
    else:
        # Save to local folder in development
        return {"url": await save_to_local(file, item_id, user_id)}

@router.delete("/{item_id}/{user_id}/{file_name}")
async def delete_file(item_id: str, user_id: str, file_name: str) -> dict:
    if settings.ENVIRONMENT == "production":
        # Delete the file from S3 in production
        raise HTTPException(status_code=501, detail="S3 listing not implemented")
    else:
        # Delete the file from the local folder in development
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
async def delete_item_images(item_id: str) -> dict:
    if settings.ENVIRONMENT == "production":
        # Delete the folder from S3 in production
        raise HTTPException(status_code=501, detail="S3 listing not implemented")
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
            return {"message": "Item images deleted successfully"}
        except Exception as _:
            raise HTTPException(status_code=500, detail="Failed to delete item images")

@router.get("/{item_id}/{user_id}")
async def get_files(item_id: str, user_id: str) -> dict:
    if settings.ENVIRONMENT == "production":
        # Get files from S3 in production
        raise HTTPException(status_code=501, detail="S3 listing not implemented")
    else:
        # Get files from the local folder in development
        upload_dir = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}")
        files = [file.name for file in upload_dir.iterdir()]
        return {"files": files}

@router.get("/{item_id}/{user_id}/{file_name}")
async def get_file(item_id: str, user_id: str, file_name: str) -> FileResponse:
    if settings.ENVIRONMENT == "production":
        # Implement logic to stream file from S3 in production
        # For example, use `boto3` to fetch the file and stream it
        raise HTTPException(status_code=501, detail="S3 streaming not implemented")
    else:
        # Stream the file from the local folder in development
        file_path = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/{file_name}")
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)

async def save_to_s3(file: UploadFile) -> str:
    """Save the file to an S3 bucket and return the file's URL."""
    logging.info("Uploading file to S3")
    s3_client = boto3.client("s3")
    bucket_name = "your-s3-bucket-name"

    try:
        s3_key = f"uploads/{file.filename}"
        s3_client.upload_fileobj(file.file, bucket_name, s3_key)
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        return s3_url
    except Exception as e:
        logging.error(f"Failed to upload file to S3: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

async def save_to_local(file: UploadFile, item_id: str, user_id: str) -> str:
    """Save the file to a local folder and return the file's local path."""
    upload_dir = Path(f"{UPLOAD_DIR}/{item_id}/{user_id}/")
    upload_dir.mkdir(parents=True, exist_ok=True)

    if file.filename is not None:
        file_path = upload_dir / file.filename

    try:
        with file_path.open("wb") as f:
            f.write(await file.read())
        return str(file_path)
    except Exception as _:
        raise HTTPException(status_code=500, detail="Failed to save file locally")
