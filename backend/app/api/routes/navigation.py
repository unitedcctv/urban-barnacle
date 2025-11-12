from typing import Annotated, List, TypedDict

from fastapi import APIRouter, Depends, Header
from sqlmodel import Session, select

from app.api.deps import SessionDep, get_current_user
from app.core import security
from app.core.config import settings
from app.models import TokenPayload, User, Producer
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from app.models import UserPermission

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


@router.get("/", response_model=List[NavigationItem])
def get_navigation_items(
    *,
    session: SessionDep,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> list[NavigationItem]:
    """Return navigation items appropriate for the current (optional) user."""

    user = _get_user_optional(session, authorization)

    items: list[NavigationItem] = [
        {"title": "Items", "path": "/items", "icon": "gallery", "action": None},
        {"title": "Producers", "path": "/producers", "icon": "producers", "action": None},
        {"title": "Community", "path": "/community", "icon": "community", "action": None},
    ]

    if user:
        if user.is_active:
            items.append({"title": "Settings", "path": "/settings", "icon": "settings", "action": None})

        if UserPermission.SUPERUSER in user.permissions:
            items.insert(0, {"title": "SU Admin", "path": "/suadmin", "icon": "su_settings", "action": None})

        if user.permissions in [UserPermission.INVESTOR, UserPermission.SUPERUSER]:
            items.append({"title": "Business Plan", "path": "/businessplan", "icon": "business", "action": None})

        if user.permissions in [UserPermission.PRODUCER, UserPermission.SUPERUSER]:
            items.append({"title": "Create Item", "path": "/createitem", "icon": "add_item", "action": None})
            
            # Only show producer profile menu items for regular producers, not superusers
            # Superusers edit producer profiles through the user list
            if user.permissions == UserPermission.PRODUCER:
                # Check if user has a producer profile
                producer = session.exec(
                    select(Producer).where(Producer.user_id == user.id)
                ).first()
                
                if producer:
                    items.append({"title": "Edit Producer Profile", "path": "/editproducer", "icon": "producer_edit", "action": None})
                else:
                    items.append({"title": "Create Producer Profile", "path": "/createproducer", "icon": "producer_edit", "action": None})

    return items  # type: ignore
