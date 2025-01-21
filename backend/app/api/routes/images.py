from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import boto3
from botocore.exceptions import BotoCoreError, ClientError
import os
from pathlib import Path
from app.core.config import settings
from logging import getLogger

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    if settings.ENVIRONMENT == "production":
        # Save to S3 in production
        return {"url": await save_to_s3(file)}
    else:
        # Save to local folder in development
        return {"url": await save_to_local(file)}

@router.delete("/")
async def delete_file(file_name: str):
    if settings.ENVIRONMENT == "production":
        # Delete the file from S3 in production
        pass
    else:
        # Delete the file from the local folder in development
        file_path = Path(f"./uploads/{file_name}")
        try:
            os.remove(file_path)
            return {"message": "File deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to delete file")
        
@router.get("/")
async def get_files():
    if settings.ENVIRONMENT == "production":
        # Get files from S3 in production
        pass
    else:
        # Get files from the local folder in development
        upload_dir = Path("./uploads")
        files = [file.name for file in upload_dir.iterdir()]
        return {"files": files}
    
@router.get("/{file_name}")
async def get_file(file_name: str):
    if settings.ENVIRONMENT == "production":
        # Implement logic to stream file from S3 in production
        # For example, use `boto3` to fetch the file and stream it
        raise HTTPException(status_code=501, detail="S3 streaming not implemented")
    else:
        # Stream the file from the local folder in development
        file_path = Path(f"./uploads/{file_name}")
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
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail="Failed to upload file to S3")

async def save_to_local(file: UploadFile) -> str:
    """Save the file to a local folder and return the file's local path."""
    upload_dir = Path("./uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    try:
        with file_path.open("wb") as f:
            f.write(await file.read())
        return str(file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file locally")

