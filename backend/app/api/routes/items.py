import os
import uuid
from typing import Any
import logging

from fastapi import APIRouter, HTTPException, Request
from sqlmodel import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, OptionalCurrentUser, SessionDep
from app.core.config import settings
from app.core.storage import delete_from_bunnycdn
from app.models import Item, ItemCreate, ItemImage, ItemPublic, ItemsPublic, ItemUpdate, ItemWithPermissions, Message, Producer
from app.blockchain.blockchain_service import blockchain_service

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    request: Request, session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """
    count_statement = select(func.count()).select_from(Item)
    count = session.exec(count_statement).one()
    statement = select(Item).options(
        selectinload(Item.item_images),
        selectinload(Item.producer)
    ).offset(skip).limit(limit)
    items = session.exec(statement).all()
    
    # Get base URL from request
    base_url = str(request.base_url).rstrip('/')
    items_public = [ItemPublic.from_item(item, base_url) for item in items]

    return ItemsPublic(data=items_public, count=count)


@router.get("/my-items/", response_model=ItemsPublic)
def read_my_items(
    request: Request, session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items for the current user.
    """
    count_statement = (
        select(func.count())
        .select_from(Item)
        .where(Item.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(Item)
        .options(
            selectinload(Item.item_images),
            selectinload(Item.producer)
        )
        .where(Item.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    items = session.exec(statement).all()
    
    # Get base URL from request
    base_url = str(request.base_url).rstrip('/')
    items_public = [ItemPublic.from_item(item, base_url) for item in items]

    return ItemsPublic(data=items_public, count=count)


@router.get("/{id}", response_model=ItemWithPermissions)
def read_item(request: Request, session: SessionDep, current_user: OptionalCurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID with edit permissions.
    """
    statement = select(Item).options(
        selectinload(Item.item_images),
        selectinload(Item.producer)
    ).where(Item.id == id)
    item = session.exec(statement).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Get base URL from request
    base_url = str(request.base_url).rstrip('/')
    
    # Create ItemPublic instance from the item with image URLs
    item_public = ItemPublic.from_item(item, base_url)
    
    # Check if user can edit (superuser OR item owner)
    can_edit = False
    if current_user:
        can_edit = (
            "superuser" in current_user.permissions or 
            item.owner_id == current_user.id
        )
    
    # Return item with edit permissions
    return ItemWithPermissions(
        item=item_public,
        can_edit=can_edit
    )


@router.post("/", response_model=ItemPublic)
def create_item(
    *, request: Request, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item.
    """
    # Check if user has a producer profile and set producer_id
    producer = session.exec(
        select(Producer).where(Producer.user_id == current_user.id)
    ).first()
    
    update_data = {"owner_id": current_user.id}
    if producer:
        update_data["producer_id"] = producer.id
    
    # Create the item
    item = Item.model_validate(item_in, update=update_data)
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # Reload item with producer relationship for response
    statement = select(Item).options(
        selectinload(Item.item_images),
        selectinload(Item.producer)
    ).where(Item.id == item.id)
    item = session.exec(statement).first()
    
    # Get base URL and return with image URLs
    base_url = str(request.base_url).rstrip('/')
    return ItemPublic.from_item(item, base_url)


@router.post("/{id}/mint-nft", response_model=ItemPublic)
def mint_item_nft(
    *, request: Request, session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Mint NFT for an existing item.
    """
    logger = logging.getLogger(__name__)
    
    # Get the item with images and producer
    statement = select(Item).options(
        selectinload(Item.item_images),
        selectinload(Item.producer)
    ).where(Item.id == id)
    item = session.exec(statement).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user owns the item
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if NFT is already minted
    if item.nft_token_id is not None:
        raise HTTPException(status_code=400, detail="NFT already minted for this item")
    
    # Check if NFT is enabled for this item
    if not item.is_nft_enabled:
        raise HTTPException(status_code=400, detail="NFT is not enabled for this item")
    
    # Check if blockchain service is available
    if not blockchain_service.is_available():
        raise HTTPException(status_code=503, detail="Blockchain service is not available")
    
    try:
        # Use a different address for NFT recipient to avoid minting to sender
        # For testing, use Hardhat's second default account as recipient
        # In production, this should come from user's connected wallet address
        owner_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  # Hardhat account #1
        
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
            
            # Debug: Log the NFT data being saved
            logger.info(f"Saving NFT data to database for item {item.id}:")
            logger.info(f"  Token ID: {item.nft_token_id}")
            logger.info(f"  Contract: {item.nft_contract_address}")
            logger.info(f"  TX Hash: {item.nft_transaction_hash}")
            
            # Ensure the item is properly updated in the session
            session.merge(item)  # Use merge instead of add to handle existing objects
            session.commit()
            session.refresh(item)
            
            # Verify the data was saved
            logger.info(f"After commit - Token ID in DB: {item.nft_token_id}")
            logger.info(f"NFT minted for item {item.id}: Token ID {nft_result['token_id']}")
            
            # Get base URL and return with image URLs
            base_url = str(request.base_url).rstrip('/')
            return ItemPublic.from_item(item, base_url)
        else:
            logger.warning(f"Failed to mint NFT for item {item.id}")
            raise HTTPException(status_code=500, detail="Failed to mint NFT")
            
    except Exception as e:
        logger.error(f"Error minting NFT for item {item.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error minting NFT: {str(e)}")


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    *,
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    statement = select(Item).options(
        selectinload(Item.item_images),
        selectinload(Item.producer)
    ).where(Item.id == id)
    item = session.exec(statement).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if "superuser" not in current_user.permissions and (
        item.owner_id != current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    # Compute final state to validate constraints
    new_is_original = update_dict.get("is_original", item.is_original)
    new_variant_of = update_dict.get("variant_of", item.variant_of)
    if new_is_original is False and new_variant_of is None:
        raise HTTPException(status_code=400, detail="variant_of must be provided when is_original is false")

    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # Get base URL and return with image URLs
    base_url = str(request.base_url).rstrip('/')
    return ItemPublic.from_item(item, base_url)


@router.delete("/{id}")
async def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an item and its associated images.
    """
    item = session.get(Item, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if "superuser" not in current_user.permissions and (
        item.owner_id != current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Delete physical image files before deleting item
    statement = select(ItemImage).where(ItemImage.item_id == id)
    item_images = session.exec(statement).all()
    
    for image in item_images:
        if settings.bunnycdn_enabled:
            try:
                await delete_from_bunnycdn(image.path)
            except Exception as e:
                logging.error(f"Failed to delete from BunnyCDN: {e}")
        else:
            # Delete from local folder
            try:
                base_url = str(settings.BACKEND_HOST)
                relative_path = image.path.replace(base_url, "")
                # Remove leading slash and 'uploads/' prefix since UPLOAD_DIR already points to uploads folder
                relative_path = relative_path.lstrip("/").replace("uploads/", "", 1)
                file_path = settings.UPLOAD_DIR / relative_path
                if file_path.exists():
                    os.remove(file_path)
                    logging.info(f"Deleted file: {file_path}")
                else:
                    logging.warning(f"File not found: {file_path}")
            except Exception as e:
                logging.error(f"Failed to delete file {image.path}: {e}")
    
    # Delete item (cascade will handle database records)
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
