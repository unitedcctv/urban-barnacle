import stripe
from typing import Any
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.deps import SessionDep, CurrentUser
from app.core.config import settings
from app.models import Item
from app import crud

# Initialize Stripe
if settings.stripe_enabled:
    stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payments", tags=["payments"])


class CheckoutRequest(BaseModel):
    item_id: str
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutResponse(BaseModel):
    url: str


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Create a Stripe checkout session for purchasing a model.
    """
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=400, 
            detail="Stripe payments are not configured"
        )
    
    # Get the item from database
    item = session.get(Item, request.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if item has a model file to purchase
    if not item.model:
        raise HTTPException(
            status_code=400, 
            detail="This item does not have a purchasable model"
        )
    
    try:
        # Set default URLs if not provided
        success_url = request.success_url or f"{settings.FRONTEND_HOST}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = request.cancel_url or f"{settings.FRONTEND_HOST}/payment/cancel"
        
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{item.title} - 3D Model",
                        "description": item.description or f"3D model file for {item.title}",
                    },
                    "unit_amount": 1000,  # $10.00 - you can make this configurable per item
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "item_id": str(item.id),
                "user_id": str(current_user.id),
                "user_email": current_user.email,
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
    current_user: CurrentUser,
) -> Any:
    """
    Handle successful payment and provide secure download link.
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
        
        # Get item ID from metadata
        item_id = checkout_session.metadata.get("item_id")
        if not item_id:
            raise HTTPException(
                status_code=400, 
                detail="Invalid session metadata"
            )
        
        # Get the item
        item = session.get(Item, item_id)
        if not item or not item.model:
            raise HTTPException(
                status_code=404, 
                detail="Model file not found"
            )
        
        # For now, return the direct model URL
        # In production, you'd want to generate a time-limited presigned URL
        # or serve the file through a secure endpoint
        return {
            "message": "Payment successful!",
            "download_url": item.model,
            "item_title": item.title,
            "expires_in": "10 minutes"
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
        # Log successful payment, update database, send confirmation email, etc.
        print(f"Payment completed for session: {session_data['id']}")
    
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
