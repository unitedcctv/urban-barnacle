import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlmodel import Session, func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.config import settings
from app.core.db import engine
from app.models import (
    ContactEnquiriesPublic,
    ContactEnquiry,
    ContactEnquiryCreate,
    Message,
)
from app.utils import (
    generate_enquiry_acknowledgement_email,
    generate_enquiry_notification_email,
    send_email_with_logging,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enquiries", tags=["enquiries"])

# Simple in-memory rate limiter: max submissions per IP per rolling window.
# Per-process state; adequate as a first line of defence alongside the honeypot.
ENQUIRY_RATE_LIMIT_MAX = 5
ENQUIRY_RATE_LIMIT_WINDOW_MINUTES = 60
_submission_log: dict[str, list[datetime]] = {}


def _enforce_rate_limit(ip: str) -> None:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=ENQUIRY_RATE_LIMIT_WINDOW_MINUTES)
    attempts = [t for t in _submission_log.get(ip, []) if t > window_start]
    if len(attempts) >= ENQUIRY_RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many enquiries submitted. Please try again later.",
        )
    attempts.append(now)
    _submission_log[ip] = attempts


def reset_rate_limits() -> None:
    """Clear the rate limiter state (used by tests)."""
    _submission_log.clear()


def _send_acknowledgement_background(
    name: str,
    email: str,
) -> None:
    """
    Background task: acknowledge the visitor after the owner notification succeeds.
    Creates its own database session for logging.
    """
    with Session(engine) as session:
        acknowledgement = generate_enquiry_acknowledgement_email(
            email_to=email, name=name
        )
        send_email_with_logging(
            session=session,
            email_to=email,
            subject=acknowledgement.subject,
            html_content=acknowledgement.html_content,
            email_type="enquiry_acknowledgement",
        )


@router.post("/", response_model=Message, status_code=201)
def submit_enquiry(
    *,
    session: SessionDep,
    request: Request,
    background_tasks: BackgroundTasks,
    enquiry_in: ContactEnquiryCreate,
) -> Any:
    """
    Submit a contact form enquiry (public, no authentication required).

    Spam protection:
    - Honeypot: submissions with the hidden 'website' field filled in are
      silently accepted but discarded, so bots get no signal.
    - Rate limiting: at most ENQUIRY_RATE_LIMIT_MAX submissions per IP per
      ENQUIRY_RATE_LIMIT_WINDOW_MINUTES minutes.
    """
    if enquiry_in.website:
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"Contact form honeypot triggered by {client_host}")
        return Message(message="Thank you for your enquiry. We'll get back to you soon.")

    client_ip = request.client.host if request.client else "unknown"
    _enforce_rate_limit(client_ip)

    enquiry = ContactEnquiry.model_validate(enquiry_in)
    session.add(enquiry)
    session.commit()
    session.refresh(enquiry)
    logger.info(f"Contact enquiry {enquiry.id} received from {enquiry.email}")

    recipient = settings.CONTACT_FORM_EMAIL or settings.EMAILS_FROM_EMAIL
    delivery_error = "Sorry, we couldn't send your message. Please email karl@ubdm.io directly."
    if not settings.emails_enabled or not recipient:
        logger.warning(
            f"Email is disabled; enquiry {enquiry.id} stored but no notification sent"
        )
        raise HTTPException(status_code=503, detail=delivery_error)

    notification = generate_enquiry_notification_email(
        name=enquiry.name,
        email=enquiry.email,
        subject=enquiry.subject,
        message=enquiry.message,
    )
    sent = send_email_with_logging(
        session=session,
        email_to=recipient,
        subject=notification.subject,
        html_content=notification.html_content,
        email_type="contact_enquiry",
        reply_to=enquiry.email,
    )
    if not sent:
        raise HTTPException(status_code=503, detail=delivery_error)

    background_tasks.add_task(
        _send_acknowledgement_background,
        name=enquiry.name,
        email=enquiry.email,
    )

    return Message(message="Thank you for your enquiry. We'll get back to you soon.")


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ContactEnquiriesPublic,
)
def read_enquiries(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve contact form enquiries (superusers only), newest first.
    """
    count = session.exec(select(func.count()).select_from(ContactEnquiry)).one()
    enquiries = session.exec(
        select(ContactEnquiry)
        .order_by(ContactEnquiry.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return ContactEnquiriesPublic(data=enquiries, count=count)
