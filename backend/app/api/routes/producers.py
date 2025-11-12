import logging
import os
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.storage import delete_from_bunnycdn
from app.models import (
    Message,
    Producer,
    ProducerCreate,
    ProducerImage,
    ProducerPublic,
    ProducersPublic,
    ProducerUpdate,
    UserPermission,
)

router = APIRouter(prefix="/producers", tags=["producers"])


@router.get("/me", response_model=ProducerPublic | None)
def read_my_producer(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get current user's producer profile.
    """
    if current_user.permissions not in [UserPermission.PRODUCER, UserPermission.SUPERUSER]:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    statement = select(Producer).where(Producer.user_id == current_user.id)
    producer = session.exec(statement).first()
    return producer


@router.get("/", response_model=ProducersPublic)
def read_producers(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve producers.
    """
    count_statement = select(func.count()).select_from(Producer)
    count = session.exec(count_statement).one()
    statement = select(Producer).offset(skip).limit(limit)
    producers = session.exec(statement).all()
    return ProducersPublic(data=producers, count=count)


@router.get("/by-user/{user_id}", response_model=ProducerPublic | None)
def read_producer_by_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Any:
    """
    Get producer by user ID.
    Only superusers can access this endpoint.
    """
    if current_user.permissions != UserPermission.SUPERUSER:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    statement = select(Producer).where(Producer.user_id == user_id)
    producer = session.exec(statement).first()
    return producer


@router.get("/{id}", response_model=ProducerPublic)
def read_producer(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get producer by ID.
    """
    producer = session.get(Producer, id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producer not found")
    return producer


@router.post("/for-user/{user_id}", response_model=ProducerPublic)
def create_producer_for_user(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
    producer_in: ProducerCreate
) -> Any:
    """
    Create new producer for a specific user.
    Only superusers can create producers for other users.
    """
    if current_user.permissions != UserPermission.SUPERUSER:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    # Check if user already has a producer profile
    existing = session.exec(
        select(Producer).where(Producer.user_id == user_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="User already has a producer profile"
        )
    
    producer = Producer.model_validate(producer_in, update={"user_id": user_id})
    session.add(producer)
    session.commit()
    session.refresh(producer)
    return producer


@router.post("/", response_model=ProducerPublic)
def create_producer(
    *, session: SessionDep, current_user: CurrentUser, producer_in: ProducerCreate
) -> Any:
    """
    Create new producer.
    Only users with producer permissions can create producers.
    """
    if current_user.permissions not in [UserPermission.PRODUCER, UserPermission.SUPERUSER]:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    # Check if user already has a producer profile
    existing = session.exec(
        select(Producer).where(Producer.user_id == current_user.id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="User already has a producer profile"
        )
    
    producer = Producer.model_validate(producer_in, update={"user_id": current_user.id})
    session.add(producer)
    session.commit()
    session.refresh(producer)
    return producer


@router.put("/{id}", response_model=ProducerPublic)
def update_producer(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    producer_in: ProducerUpdate,
) -> Any:
    """
    Update a producer.
    Only users with producer permissions can update their own producer profile.
    """
    if current_user.permissions not in [UserPermission.PRODUCER, UserPermission.SUPERUSER]:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    producer = session.get(Producer, id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producer not found")
    
    # Check if user owns this producer profile (unless superuser)
    if current_user.permissions != UserPermission.SUPERUSER and producer.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this producer profile"
        )
    
    update_dict = producer_in.model_dump(exclude_unset=True)
    producer.sqlmodel_update(update_dict)
    session.add(producer)
    session.commit()
    session.refresh(producer)
    return producer


@router.delete("/{id}")
async def delete_producer(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a producer.
    Only users can delete their own producer profile.
    """
    if current_user.permissions not in [UserPermission.PRODUCER, UserPermission.SUPERUSER]:
        raise HTTPException(
            status_code=403, detail="Not enough permissions"
        )
    
    producer = session.get(Producer, id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producer not found")
    
    # Check if user owns this producer profile (unless superuser)
    if current_user.permissions != UserPermission.SUPERUSER and producer.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this producer profile"
        )
    
    # Delete physical image files before deleting producer
    statement = select(ProducerImage).where(ProducerImage.producer_id == id)
    producer_images = session.exec(statement).all()
    
    logging.info(f"Found {len(producer_images)} images to delete for producer {id}")
    
    for image in producer_images:
        logging.info(f"Processing image: path={image.path}, type={image.image_type}")
        
        if settings.bunnycdn_enabled:
            try:
                await delete_from_bunnycdn(image.path)
                logging.info(f"Deleted from BunnyCDN: {image.path}")
            except Exception as e:
                logging.error(f"Failed to delete from BunnyCDN: {e}")
        else:
            # Delete from local folder
            try:
                base_url = str(settings.BACKEND_HOST)
                logging.info(f"Base URL: {base_url}")
                logging.info(f"Image path: {image.path}")
                
                relative_path = image.path.replace(base_url, "")
                logging.info(f"Relative path: {relative_path}")
                
                # Remove leading slash and 'uploads/' prefix since UPLOAD_DIR already points to uploads folder
                relative_path = relative_path.lstrip("/").replace("uploads/", "", 1)
                file_path = settings.UPLOAD_DIR / relative_path
                logging.info(f"Full file path: {file_path}")
                logging.info(f"File exists: {file_path.exists()}")
                
                if file_path.exists():
                    os.remove(file_path)
                    logging.info(f"✓ Successfully deleted file: {file_path}")
                else:
                    logging.warning(f"✗ File not found at: {file_path}")
            except Exception as e:
                logging.error(f"Failed to delete file {image.path}: {e}")
    
    # Delete producer (cascade will handle database records)
    session.delete(producer)
    session.commit()
    return Message(message="Producer deleted successfully")