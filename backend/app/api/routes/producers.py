import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Producer,
    ProducerCreate,
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


@router.get("/{id}", response_model=ProducerPublic)
def read_producer(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get producer by ID.
    """
    producer = session.get(Producer, id)
    if not producer:
        raise HTTPException(status_code=404, detail="Producer not found")
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
def delete_producer(
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
    
    session.delete(producer)
    session.commit()
    return Message(message="Producer deleted successfully")