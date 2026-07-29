from typing import TypedDict

import jwt
from fastapi import APIRouter, Header
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import TokenPayload, User, UserPermission

router = APIRouter(prefix="/navigation", tags=["navigation"])


class NavigationItem(TypedDict):
    title: str
    path: str
    icon: str
    action: str | None  # 'modal' for modal actions, None for navigation


def _get_user_optional(session: Session, authorization: str | None) -> User | None:
    """Return current user if a valid Bearer token is supplied, else None."""
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        return None
    return session.get(User, token_data.sub)


@router.get("/", response_model=list[NavigationItem])
def get_navigation_items(
    *,
    session: SessionDep,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> list[NavigationItem]:
    """Return navigation items appropriate for the current (optional) user."""

    user = _get_user_optional(session, authorization)

    items: list[NavigationItem] = [
        {"title": "Gallery", "path": "/items", "icon": "gallery", "action": None},
        {"title": "About", "path": "/about", "icon": "about", "action": None},
        {"title": "Contact", "path": "/contact", "icon": "contact", "action": None},
    ]

    if user:
        if user.is_active:
            items.append({"title": "Settings", "path": "/settings", "icon": "settings", "action": None})

        if UserPermission.SUPERUSER in user.permissions:
            items.insert(0, {"title": "SU Admin", "path": "/suadmin", "icon": "su_settings", "action": None})

    return items  # type: ignore
