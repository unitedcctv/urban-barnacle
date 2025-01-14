from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3
from botocore.exceptions import BotoCoreError, ClientError
import os
from pathlib import Path
from app.core.config import settings
from logging import getLogger

router = APIRouter(prefix="/images", tags=["images"])

logging = getLogger(__name__)
logging.setLevel("INFO")

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
        return str(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file locally")

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    if settings.ENVIRONMENT != "local":
        # Save to S3 in production
        return {"url": await save_to_s3(file)}
    else:
        # Save to local folder in development
        return {"url": await save_to_local(file)}



