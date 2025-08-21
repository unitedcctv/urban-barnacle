import uuid
from datetime import datetime

from pydantic import EmailStr
from enum import Enum
from sqlalchemy import Column, String, DateTime
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserPermission(str, Enum):
    SUPERUSER = "superuser"
    GUEST = "guest"
    INVESTOR = "investor"
    PRODUCER = "producer"


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = False  # Changed to False by default - users must confirm email
    permissions: UserPermission = Field(
        default=UserPermission.GUEST,
        sa_column=Column(String(length=255), nullable=False),
    )
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    images: str | None = Field(default=None)  # Store as comma-separated string
    model: str | None = Field(default=None)
    certificate: str | None = Field(default=None)
    # Original/Variant linkage
    is_original: bool = Field(default=True)
    variant_of: uuid.UUID | None = Field(default=None, foreign_key="item.id")
    # NFT-related fields
    nft_token_id: int | None = Field(default=None)
    nft_contract_address: str | None = Field(default=None, max_length=255)
    nft_transaction_hash: str | None = Field(default=None, max_length=255)
    nft_metadata_uri: str | None = Field(default=None, max_length=500)
    is_nft_enabled: bool = Field(default=True)  # Whether to create NFT for this item

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
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):  # type: ignore[call-arg]
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


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
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class EmailConfirmation(SQLModel):
    token: str


class ImageUpload:
    image: str
    item_id: uuid.UUID
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    image_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
