import uuid
from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from enum import Enum
from sqlalchemy import Column, String, DateTime
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserPermission(str, Enum):
    SUPERUSER = "superuser"
    GUEST = "guest"
    COLLECTOR = "collector"


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = False  # Changed to False by default - users must confirm email
    permissions: UserPermission = Field(
        default=UserPermission.GUEST,
        sa_column=Column(String(length=255), nullable=False),
    )
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: Optional[EmailStr] = Field(default=None, max_length=255)  # type: ignore
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=255)
    images: Optional[str] = Field(default=None)  # Store as comma-separated string
    model: Optional[str] = Field(default=None)
    certificate: Optional[str] = Field(default=None)
    # Original/Variant linkage
    is_original: bool = Field(default=True)
    variant_of: Optional[uuid.UUID] = Field(default=None, foreign_key="item.id")


    def get_images(self) -> list[str]:
        return self.images.split(",") if self.images else []

    def set_images(self, images: list[str]) -> None:
        self.images = ",".join(images)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    @classmethod
    def model_validate(cls, obj=None, *, from_attributes=False, context=None):  # type: ignore[override]
        model = super().model_validate(obj, from_attributes=from_attributes, context=context)
        # Enforce: if not original, must point to an original item id
        if model.is_original is False and model.variant_of is None:
            raise ValueError("variant_of must be provided when is_original is false")
        return model


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    owner: Optional[User] = Relationship(back_populates="items")
    item_images: list["ItemImage"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    image_urls: list[str] = []  # URLs/paths to images from Image table

    @classmethod
    def from_item(cls, item: "Item", base_url: str = "") -> "ItemPublic":
        """Create ItemPublic from Item with image URLs."""
        from app.core.config import settings
        import logging

        logger = logging.getLogger(__name__)

        image_urls = []
        if hasattr(item, 'item_images') and item.item_images:
            logger.info(f"Processing {len(item.item_images)} images for item {item.id}, environment: {settings.ENVIRONMENT}")
            for img in item.item_images:
                # Storage module now returns proper URLs for both local and CDN
                # Local: http://localhost:8000/uploads/images/filename.webp
                # CDN: https://zone.b-cdn.net/images/filename.webp
                # Just use the stored path directly
                logger.info(f"Image {img.id}: using path={img.path}")
                image_urls.append(img.path)

        return cls(
            id=item.id,
            owner_id=item.owner_id,
            title=item.title,
            description=item.description,
            images=item.images,
            model=item.model,
            certificate=item.certificate,
            is_original=item.is_original,
            variant_of=item.variant_of,
            image_urls=image_urls
        )


class ItemWithPermissions(SQLModel):
    """Item data with edit permissions"""
    item: ItemPublic
    can_edit: bool = False


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: Optional[str] = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class EmailConfirmation(SQLModel):
    token: str


# Shared properties for Image
class ImageBase(SQLModel):
    path: str = Field(max_length=500)  # Full path or URL to the image
    name: str = Field(max_length=255)  # Filename without extension
    item_id: uuid.UUID = Field(foreign_key="item.id", nullable=False, ondelete="CASCADE")


# Properties to receive on image creation
class ImageCreate(ImageBase):
    pass


# Properties to receive on image update
class ImageUpdate(SQLModel):
    path: Optional[str] = Field(default=None, max_length=500)
    name: Optional[str] = Field(default=None, max_length=255)


# Database model, database table inferred from class name
class ItemImage(ImageBase, table=True):  # type: ignore[call-arg]
    __tablename__ = "image"  # Keep existing table name for backward compatibility
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    item: Optional["Item"] = Relationship(back_populates="item_images")


# Properties to return via API, id is always required
class ImagePublic(ImageBase):
    id: uuid.UUID
    created_at: datetime


class ImagesPublic(SQLModel):
    data: list[ImagePublic]
    count: int


# Email Log for tracking email sends
class EmailLogBase(SQLModel):
    email_to: str = Field(max_length=255)
    email_type: str = Field(max_length=50)  # e.g., "welcome", "confirmation", "password_reset"
    subject: str = Field(max_length=255)
    status: str = Field(max_length=20)  # "pending", "sent", "failed"
    error_message: Optional[str] = Field(default=None, max_length=1000)


# Database model
class EmailLog(EmailLogBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )
    sent_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=True)
    )


# Properties to return via API
class EmailLogPublic(EmailLogBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    created_at: datetime
    sent_at: Optional[datetime]


# Shared properties for NFC tags (NTAG 424 DNA)
# NOTE: No key material is ever stored in the database. Per-tag keys are
# derived from a master key (NFC_MASTER_KEY env var) via AES-CMAC
# diversification using the tag UID.
class NfcTagStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class NfcTagBase(SQLModel):
    uid: str = Field(min_length=14, max_length=14, regex=r"^[0-9A-Fa-f]{14}$")  # 7-byte UID as hex
    item_id: uuid.UUID = Field(foreign_key="item.id", nullable=False)


# Properties to receive on tag registration
class NfcTagCreate(NfcTagBase):
    pass


# Database model
class NfcTag(NfcTagBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    uid: str = Field(min_length=14, max_length=14, unique=True, index=True)
    last_read_counter: Optional[int] = Field(default=None)  # None = never tapped
    status: NfcTagStatus = Field(
        default=NfcTagStatus.ACTIVE,
        sa_column=Column(String(length=20), nullable=False),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False)
    )


# Properties to return via API
class NfcTagPublic(NfcTagBase):
    id: uuid.UUID
    last_read_counter: Optional[int]
    status: NfcTagStatus
    created_at: datetime


class NfcTagsPublic(SQLModel):
    data: list[NfcTagPublic]
    count: int
