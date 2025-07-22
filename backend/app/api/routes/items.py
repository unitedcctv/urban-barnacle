import uuid
from typing import Any
import logging

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate, Message
from app.blockchain_service import blockchain_service

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """

    if "superuser" in current_user.permissions:
        count_statement = select(func.count()).select_from(Item)
        count = session.exec(count_statement).one()
        statement = select(Item).offset(skip).limit(limit)
        items = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Item)
            .where(Item.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Item)
            .where(Item.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()

    return ItemsPublic(data=items, count=count)


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if "superuser" not in current_user.permissions and (
        item.owner_id != current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return item


@router.post("/", response_model=ItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item and optionally mint NFT.
    """
    logger = logging.getLogger(__name__)
    
    # Create the item first
    item = Item.model_validate(item_in, update={"owner_id": current_user.id})
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # If NFT is enabled and blockchain service is available, mint NFT
    if item.is_nft_enabled and blockchain_service.is_available():
        try:
            # For now, use a placeholder wallet address - in production, this should come from user's wallet
            # You might want to add a wallet_address field to the User model
            owner_address = "0x0000000000000000000000000000000000000000"  # Placeholder
            
            # Create metadata URI (you might want to implement IPFS storage here)
            metadata_uri = f"https://your-api.com/api/v1/items/{item.id}/metadata"
            
            nft_result = blockchain_service.mint_item_nft(
                owner_address=owner_address,
                item_id=str(item.id),
                title=item.title,
                description=item.description or "",
                model=item.model or "",
                certificate=item.certificate or "",
                images=item.images or "",
                metadata_uri=metadata_uri
            )
            
            if nft_result:
                # Update item with NFT information
                item.nft_token_id = nft_result["token_id"]
                item.nft_contract_address = nft_result["contract_address"]
                item.nft_transaction_hash = nft_result["transaction_hash"]
                item.nft_metadata_uri = metadata_uri
                
                session.add(item)
                session.commit()
                session.refresh(item)
                
                logger.info(f"NFT minted for item {item.id}: Token ID {nft_result['token_id']}")
            else:
                logger.warning(f"Failed to mint NFT for item {item.id}")
                
        except Exception as e:
            logger.error(f"Error minting NFT for item {item.id}: {e}")
            # Don't fail the item creation if NFT minting fails
    
    return item


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if "superuser" not in current_user.permissions and (
        item.owner_id != current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an item.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if "superuser" not in current_user.permissions and (
        item.owner_id != current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
