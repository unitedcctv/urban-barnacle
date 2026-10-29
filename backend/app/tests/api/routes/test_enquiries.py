from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.routes import enquiries
from app.core.config import settings
from app.models import ContactEnquiry, EmailLog
from app.utils import send_email as configured_sender


@pytest.fixture(autouse=True)
def configured_email():
    with (
        patch("app.utils.send_email"),
        patch.object(settings, "SMTP_HOST", "smtp.example.com"),
        patch.object(settings, "EMAILS_FROM_EMAIL", "noreply@example.com"),
    ):
        yield


@pytest.fixture(autouse=True)
def reset_enquiry_rate_limits() -> None:
    enquiries.reset_rate_limits()


def _payload(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "name": "Jane Visitor",
        "email": "jane@example.com",
        "subject": "Question about an item",
        "message": "Hello, is this item still available?",
    }
    data.update(overrides)
    return data


def test_submit_enquiry_persists_and_sends_emails(
    client: TestClient, db: Session
) -> None:
    with (
        patch("app.utils.send_email", return_value=None),
        patch("app.core.config.settings.SMTP_HOST", "smtp.example.com"),
        patch("app.core.config.settings.SMTP_USER", "admin@example.com"),
        patch(
            "app.core.config.settings.CONTACT_FORM_EMAIL", "enquiries@example.com"
        ),
        patch(
            "app.core.config.settings.EMAILS_FROM_EMAIL", "noreply@example.com"
        ),
    ):
        r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())

    assert r.status_code == 201
    assert r.json() == {
        "message": "Thank you for your enquiry. We'll get back to you soon."
    }

    enquiry = db.exec(select(ContactEnquiry)).first()
    assert enquiry is not None
    assert enquiry.name == "Jane Visitor"
    assert enquiry.email == "jane@example.com"
    assert enquiry.subject == "Question about an item"
    assert enquiry.message == "Hello, is this item still available?"
    assert enquiry.status == "new"

    # The owner notification runs before responding; TestClient also waits
    # for the background acknowledgement, so both should be logged.
    logs = db.exec(select(EmailLog).order_by(EmailLog.created_at)).all()
    email_types = [log.email_type for log in logs]
    assert email_types == ["contact_enquiry", "enquiry_acknowledgement"]
    assert logs[0].email_to == "enquiries@example.com"
    assert logs[1].email_to == "jane@example.com"


def test_submit_enquiry_without_smtp_still_persists(
    client: TestClient, db: Session
) -> None:
    with patch("app.core.config.settings.SMTP_HOST", None):
        r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())
    assert r.status_code == 503
    assert "karl@ubdm.io" in r.json()["detail"]

    enquiry = db.exec(select(ContactEnquiry)).first()
    assert enquiry is not None
    assert db.exec(select(EmailLog)).first() is None


def test_smtp_rejection_returns_error_and_keeps_enquiry(
    client: TestClient, db: Session
) -> None:
    from emails.backend.response import SMTPResponse

    response = SMTPResponse()
    response.set_status("mail", 530, b"5.7.0 Authentication required")
    # Exercise the real sender, including the SMTP response check.
    from app import utils

    with (
        patch("app.utils.send_email", wraps=configured_sender),
        patch.object(utils.emails, "Message") as message,
    ):
        message.return_value.send.return_value = response
        r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())

    assert r.status_code == 503
    assert "karl@ubdm.io" in r.json()["detail"]
    assert "530" not in r.json()["detail"]
    assert db.exec(select(ContactEnquiry)).first() is not None
    logs = db.exec(select(EmailLog)).all()
    assert len(logs) == 1
    assert logs[0].status == "failed"
    assert logs[0].sent_at is None
    assert "530" in logs[0].error_message


def test_acknowledgement_failure_does_not_fail_submission(
    client: TestClient, db: Session
) -> None:
    with patch("app.utils.send_email", side_effect=[None, RuntimeError("SMTP error")]):
        r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())
    assert r.status_code == 201
    logs = db.exec(select(EmailLog).order_by(EmailLog.created_at)).all()
    assert [log.status for log in logs] == ["sent", "failed"]


def test_submit_enquiry_honeypot_discarded_silently(
    client: TestClient, db: Session
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/enquiries/",
        json=_payload(website="http://spam.example.com"),
    )
    # Bots get the same success response as humans
    assert r.status_code == 201
    assert db.exec(select(ContactEnquiry)).first() is None


def test_submit_enquiry_validation_error(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/enquiries/",
        json=_payload(email="not-an-email"),
    )
    assert r.status_code == 422


def test_submit_enquiry_rate_limited(client: TestClient, db: Session) -> None:
    for _ in range(enquiries.ENQUIRY_RATE_LIMIT_MAX):
        r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())
        assert r.status_code == 201

    r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())
    assert r.status_code == 429

    count = len(db.exec(select(ContactEnquiry)).all())
    assert count == enquiries.ENQUIRY_RATE_LIMIT_MAX


def test_read_enquiries_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    r = client.post(f"{settings.API_V1_STR}/enquiries/", json=_payload())
    assert r.status_code == 201

    r = client.get(
        f"{settings.API_V1_STR}/enquiries/", headers=superuser_token_headers
    )
    assert r.status_code == 200
    result = r.json()
    assert result["count"] == 1
    assert result["data"][0]["email"] == "jane@example.com"


def test_read_enquiries_as_normal_user_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/enquiries/", headers=normal_user_token_headers
    )
    assert r.status_code == 403


def test_read_enquiries_unauthenticated(client: TestClient) -> None:
    r = client.get(f"{settings.API_V1_STR}/enquiries/")
    assert r.status_code == 401
