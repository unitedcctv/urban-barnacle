from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import json
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.api.deps import CurrentUser, get_current_user
from app.ai.settings import settings as ai_settings

router = APIRouter(prefix="/business-plan", tags=["business-plan"])

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def _drive_client():
    """Create Google Drive client with credentials from environment variable."""
    service_account_json = ai_settings.GDRIVE_SERVICE_ACCOUNT_JSON
    
    if not service_account_json:
        raise ValueError("GDRIVE_SERVICE_ACCOUNT_JSON environment variable is required")
    
    try:
        service_account_info = json.loads(service_account_json)
        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError(f"Invalid GDRIVE_SERVICE_ACCOUNT_JSON format: {e}")
    
    return build("drive", "v3", credentials=creds, cache_discovery=False)


@router.get("/download")
def download_business_plan(
    current_user: CurrentUser,
) -> Any:
    """
    Download the business plan PDF directly from Google Drive.
    Requires authentication.
    """
    try:
        # Get the business plan document ID from settings
        doc_id = ai_settings.BUSINESS_PLAN_DOC_ID
        
        if not doc_id:
            raise HTTPException(
                status_code=500,
                detail="Business plan document ID not configured. Please contact support."
            )
        
        # Create Drive client
        drive = _drive_client()
        
        # Export the document as PDF
        pdf_data = (
            drive.files()
            .export(fileId=doc_id, mimeType="application/pdf")
            .execute()
        )
        
        # Create a BytesIO stream from the PDF data
        pdf_stream = io.BytesIO(pdf_data)
        
        # Return the PDF as a streaming response
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=urban-barnacle-business-plan.pdf"
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google Drive configuration error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download business plan: {str(e)}"
        )
