import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    Filament,
    FilamentCreate,
    FilamentPublic,
    FilamentUpdate,
    FilamentsPublic,
    Message,
)

router = APIRouter(
    prefix="/filaments",
    tags=["filaments"],
    dependencies=[Depends(get_current_active_superuser)],
)


@router.get("/", response_model=FilamentsPublic)
def read_filaments(session: SessionDep) -> Any:
    """
    Retrieve filament inventory ordered by manufacturer, material, colour.
    """
    count_statement = select(func.count()).select_from(Filament)
    count = session.exec(count_statement).one()
    statement = select(Filament).order_by(
        Filament.manufacturer, Filament.material, Filament.colour
    )
    filaments = session.exec(statement).all()
    return FilamentsPublic(
        data=[FilamentPublic.model_validate(f) for f in filaments], count=count
    )


@router.post("/", response_model=FilamentPublic)
def create_filament(*, session: SessionDep, filament_in: FilamentCreate) -> Any:
    """
    Add a new filament to the inventory.
    """
    filament = Filament.model_validate(filament_in)
    session.add(filament)
    session.commit()
    session.refresh(filament)
    return FilamentPublic.model_validate(filament)


@router.patch("/{id}", response_model=FilamentPublic)
def update_filament(
    *, session: SessionDep, id: uuid.UUID, filament_in: FilamentUpdate
) -> Any:
    """
    Update a filament entry.
    """
    filament = session.get(Filament, id)
    if not filament:
        raise HTTPException(status_code=404, detail="Filament not found")
    update_dict = filament_in.model_dump(exclude_unset=True)
    filament.sqlmodel_update(update_dict)
    session.add(filament)
    session.commit()
    session.refresh(filament)
    return FilamentPublic.model_validate(filament)


@router.delete("/{id}")
def delete_filament(session: SessionDep, id: uuid.UUID) -> Message:
    """
    Delete a filament entry.
    """
    filament = session.get(Filament, id)
    if not filament:
        raise HTTPException(status_code=404, detail="Filament not found")
    session.delete(filament)
    session.commit()
    return Message(message="Filament deleted successfully")
