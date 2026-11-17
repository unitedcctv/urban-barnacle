import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import col, func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    Filament,
    FilamentCreate,
    FilamentImportResult,
    FilamentPublic,
    FilamentsPublic,
    FilamentStockAdjustment,
    FilamentUpdate,
    Message,
)
from app.services.bambu_filaments import PRODUCT_NAME, CatalogueError, fetch_catalogue

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
    # Stock updates can change PostgreSQL's physical row order. Include variant
    # fields and a unique tie-breaker so the controls stay on the same row after
    # refetching, even for duplicate colours or manually entered variants.
    statement = select(Filament).order_by(
        Filament.manufacturer,
        Filament.material,
        Filament.colour,
        Filament.product_name,
        Filament.variant_name,
        Filament.id,
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


@router.post("/import-bambu-eu", response_model=FilamentImportResult)
def import_bambu_eu(session: SessionDep) -> FilamentImportResult:
    """Refresh PETG Basic supplier data, preserving all local stock quantities."""
    try:
        filaments = fetch_catalogue()
    except (httpx.HTTPError, CatalogueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve valid Bambu Lab EU stock. Nothing was changed. Please try again later.",
        ) from exc
    checked_at = datetime.now(timezone.utc)
    for filament in filaments:
        filament.supplier_checked_at = checked_at
        values = filament.model_dump()
        statement = insert(Filament).values(**values)
        # A unique supplier SKU makes repeated and concurrent imports idempotent.
        # In particular, never replace spools, id, created_at or manual swatches.
        statement = statement.on_conflict_do_update(
            index_elements=["supplier_sku"],
            set_={
                key: values[key]
                for key in (
                    "colour",
                    "material",
                    "manufacturer",
                    "price",
                    "purchase_url",
                    "product_name",
                    "variant_name",
                    "supplier_availability",
                    "supplier_checked_at",
                    "supplier_data",
                )
            },
        )
        session.execute(statement)
    current_skus = [filament.supplier_sku for filament in filaments]
    missing = session.exec(
        select(Filament).where(
            Filament.product_name == PRODUCT_NAME,
            col(Filament.supplier_sku).is_not(None),
            col(Filament.supplier_sku).not_in(current_skus),
        )
    ).all()
    for filament in missing:
        filament.supplier_availability = "NotListed"
        filament.supplier_checked_at = checked_at
        session.add(filament)
    session.commit()
    return FilamentImportResult(imported=len(filaments), checked_at=checked_at)


@router.post("/{id}/stock", response_model=FilamentPublic)
def adjust_local_stock(
    *, session: SessionDep, id: uuid.UUID, adjustment: FilamentStockAdjustment
) -> Any:
    """Adjust local spools under a row lock so simultaneous additions aren't lost."""
    filament = session.exec(
        select(Filament).where(Filament.id == id).with_for_update()
    ).first()
    if not filament:
        raise HTTPException(status_code=404, detail="Filament not found")
    filament.spools = max(0, round(filament.spools + adjustment.delta, 2))
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
