import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.config import settings
from app.core.nfc import NfcValidationError, validate_tag
from app.models import (
    Item,
    ItemPublic,
    ItemsPublic,
    Message,
    NfcTag,
    NfcTagCreate,
    NfcTagPublic,
    NfcTagsPublic,
    NfcTagStatus,
    Producer,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nfc", tags=["nfc"])


def _verification_failed_redirect() -> RedirectResponse:
    return RedirectResponse(url=f"{settings.FRONTEND_HOST}/verification-failed")


@router.get("/verify")
def verify_tag(
    session: SessionDep,
    uid: str,
    picc: str,
    cmac: str,
    enc: str | None = None,
) -> RedirectResponse:
    """
    Validate an NTAG 424 DNA tap (SDM/SUN) and redirect to the item page.

    Public endpoint: NFC taps arrive as plain browser GETs from the tag's
    mirrored URL. The UID travels in plaintext (written at programming time)
    so per-tag keys can be derived; authenticity comes from the encrypted
    PICC data and the CMAC, which only the genuine tag can produce.
    """
    if not settings.NFC_MASTER_KEY:
        raise HTTPException(status_code=503, detail="NFC validation is not configured")

    uid = uid.upper()
    tag = session.exec(select(NfcTag).where(NfcTag.uid == uid)).first()
    if not tag:
        logger.warning("NFC tap for unknown tag UID %s", uid)
        return _verification_failed_redirect()
    if tag.status != NfcTagStatus.ACTIVE:
        logger.warning("NFC tap for revoked tag UID %s", uid)
        return _verification_failed_redirect()

    try:
        counter = validate_tag(
            bytes.fromhex(settings.NFC_MASTER_KEY or ""), uid, picc, cmac, enc
        )
    except NfcValidationError as e:
        logger.warning("NFC validation failed for UID %s: %s", uid, e)
        return _verification_failed_redirect()

    if tag.last_read_counter is not None and counter <= tag.last_read_counter:
        logger.warning(
            "NFC replay detected for UID %s (counter %d <= %d)",
            uid,
            counter,
            tag.last_read_counter,
        )
        return _verification_failed_redirect()

    tag.last_read_counter = counter
    session.add(tag)
    session.commit()

    return RedirectResponse(
        url=f"{settings.FRONTEND_HOST}/item?id={tag.item_id}&verified=true&tap={counter}"
    )


@router.post(
    "/tags",
    response_model=NfcTagPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def register_tag(session: SessionDep, tag_in: NfcTagCreate) -> Any:
    """
    Register a tag (bind its UID to an item). Superuser only.

    Keys are not stored here — derive them offline with
    `uv run python -m app.nfc_provisioning <UID>` when programming the tag.
    """
    item = session.get(Item, tag_in.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    uid = tag_in.uid.upper()
    existing = session.exec(select(NfcTag).where(NfcTag.uid == uid)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tag UID already registered")
    tag = NfcTag(uid=uid, item_id=tag_in.item_id)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    logger.info("NFC tag %s registered for item %s", tag.uid, tag.item_id)
    return tag


@router.get(
    "/tags",
    response_model=NfcTagsPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def list_tags(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    List registered NFC tags. Superuser only.
    """
    count = session.exec(select(func.count()).select_from(NfcTag)).one()
    tags = session.exec(select(NfcTag).offset(skip).limit(limit)).all()
    return NfcTagsPublic(data=tags, count=count)


@router.get(
    "/untagged-items",
    response_model=ItemsPublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def list_untagged_items(
    request: Request, session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    List items that have no NFC tag registered. Superuser only.
    """
    join_condition = NfcTag.item_id == Item.id
    count = session.exec(
        select(func.count())
        .select_from(Item)
        .outerjoin(NfcTag, join_condition)
        .where(NfcTag.id.is_(None))  # type: ignore[union-attr]
    ).one()
    items = session.exec(
        select(Item)
        .options(
            selectinload(Item.item_images),
            selectinload(Item.producer).selectinload(Producer.producer_images),
        )
        .outerjoin(NfcTag, join_condition)
        .where(NfcTag.id.is_(None))  # type: ignore[union-attr]
        .offset(skip)
        .limit(limit)
    ).all()
    base_url = str(request.base_url).rstrip("/")
    return ItemsPublic(
        data=[ItemPublic.from_item(item, base_url) for item in items], count=count
    )


@router.delete("/tags/{uid}", dependencies=[Depends(get_current_active_superuser)])
def revoke_tag(session: SessionDep, uid: str) -> Message:
    """
    Revoke a tag so future taps fail verification. Superuser only.
    """
    tag = session.exec(select(NfcTag).where(NfcTag.uid == uid.upper())).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag.status = NfcTagStatus.REVOKED
    session.add(tag)
    session.commit()
    logger.info("NFC tag %s revoked (was bound to item %s)", tag.uid, tag.item_id)
    return Message(message="Tag revoked")
