import logging
import uuid

import stripe
from typing import Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import SessionDep
from app.core.config import settings
from app.models import Item

logger = logging.getLogger(__name__)

# Initialize Stripe
if settings.stripe_enabled:
    stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payments", tags=["payments"])


class CartCheckoutRequest(BaseModel):
    item_ids: list[str]
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutResponse(BaseModel):
    url: str


def _mark_items_sold(session: Any, item_ids: list[str]) -> None:
    """Mark purchased items as sold."""
    for item_id in item_ids:
        try:
            item = session.get(Item, uuid.UUID(item_id))
        except ValueError:
            continue
        if item and not item.is_sold:
            item.is_sold = True
            session.add(item)
    session.commit()


@router.post("/create-cart-checkout", response_model=CheckoutResponse)
async def create_cart_checkout(
    request: CartCheckoutRequest,
    session: SessionDep,
) -> Any:
    """
    Create a Stripe checkout session for purchasing cart items.
    """
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=400,
            detail="Stripe payments are not configured"
        )

    if not request.item_ids:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Resolve and validate all items
    items = []
    for item_id in request.item_ids:
        try:
            item = session.get(Item, uuid.UUID(item_id))
        except ValueError:
            item = None
        if not item:
            raise HTTPException(status_code=404, detail=f"Item not found: {item_id}")
        if item.is_sold:
            raise HTTPException(status_code=400, detail=f"Item already sold: {item.title}")
        if item.price <= 0:
            raise HTTPException(status_code=400, detail=f"Item has no price: {item.title}")
        items.append(item)

    try:
        # Set default URLs if not provided
        success_url = request.success_url or f"{settings.FRONTEND_HOST}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = request.cancel_url or f"{settings.FRONTEND_HOST}/payment/cancel"

        line_items = [
            {
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": item.title,
                        "description": item.description or item.title,
                    },
                    "unit_amount": round(item.price * 100),  # Stripe uses cents
                },
                "quantity": 1,
            }
            for item in items
        ]

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            shipping_address_collection={"allowed_countries": ["DE", "AT", "CH", "NL", "BE", "FR", "IT", "ES", "PL", "GB", "US"]},
            metadata={
                "item_ids": ",".join(str(item.id) for item in items),
            },
        )

        return CheckoutResponse(url=checkout_session.url)

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/success")
async def payment_success(
    session_id: str,
    session: SessionDep,
) -> Any:
    """
    Verify a completed payment and mark purchased items as sold.
    """
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=400,
            detail="Stripe payments are not configured"
        )

    try:
        # Retrieve the checkout session from Stripe
        checkout_session = stripe.checkout.Session.retrieve(session_id)

        # Verify payment was completed
        if checkout_session.payment_status != "paid":
            raise HTTPException(
                status_code=400,
                detail="Payment not completed"
            )

        # Get item IDs from metadata
        item_ids_raw = checkout_session.metadata.get("item_ids") or ""
        item_ids = [i for i in item_ids_raw.split(",") if i]
        if not item_ids:
            raise HTTPException(
                status_code=400,
                detail="Invalid session metadata"
            )

        # Mark items as sold (idempotent)
        _mark_items_sold(session, item_ids)

        # Fetch item titles for the confirmation page
        titles = []
        for item_id in item_ids:
            try:
                item = session.get(Item, uuid.UUID(item_id))
            except ValueError:
                item = None
            if item:
                titles.append(item.title)

        return {
            "message": "Payment successful!",
            "items": titles,
            "total": (checkout_session.amount_total or 0) / 100,
            "currency": (checkout_session.currency or "eur").upper(),
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/cancel")
async def payment_cancel() -> Any:
    """
    Handle payment cancellation.
    """
    return {"message": "Payment was canceled"}


@router.post("/webhook")
async def stripe_webhook(request: Request, session: SessionDep) -> Any:
    """
    Handle Stripe webhook events (optional - for additional security and logging).
    """
    if not settings.stripe_enabled or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Webhooks not configured")
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        logger.info(f"Payment completed for session: {session_data['id']}")
        item_ids_raw = session_data.get("metadata", {}).get("item_ids") or ""
        item_ids = [i for i in item_ids_raw.split(",") if i]
        if item_ids:
            _mark_items_sold(session, item_ids)

    return {"status": "success"}


@router.get("/config")
async def get_stripe_config() -> Any:
    """
    Get Stripe publishable key for frontend.
    """
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=400, 
            detail="Stripe payments are not configured"
        )
    
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        "enabled": True
    }
