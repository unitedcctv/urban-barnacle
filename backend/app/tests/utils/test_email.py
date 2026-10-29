from unittest.mock import MagicMock, patch

import pytest
from emails.backend.response import SMTPResponse
from fastapi import BackgroundTasks, HTTPException
from starlette.requests import Request

from app.api.routes import enquiries
from app.models import ContactEnquiryCreate
from app.utils import send_email, send_email_with_logging


@pytest.fixture(autouse=True)
def db() -> None:
    """These unit tests use a mocked session and do not need Postgres."""


@pytest.fixture(autouse=True)
def email_settings():
    with patch("app.utils.settings") as settings:
        settings.emails_enabled = True
        yield settings


def smtp_response(code: int) -> SMTPResponse:
    response = SMTPResponse()
    response.set_status("data", code, b"OK" if code == 250 else b"Authentication required")
    response._finished = code == 250
    return response


@pytest.mark.parametrize("code", [250, 530])
def test_email_log_reflects_smtp_result(code: int) -> None:
    session = MagicMock()
    with patch("app.utils.emails.Message") as message:
        message.return_value.send.return_value = smtp_response(code)
        send_email_with_logging(
            session=session,
            email_to="recipient@example.com",
            subject="Test",
            html_content="Test message",
            email_type="contact_enquiry",
        )

    email_log = session.add.call_args_list[-1].args[0]
    assert email_log.status == ("sent" if code == 250 else "failed")
    if code == 530:
        assert "530" in email_log.error_message
        assert "Authentication required" in email_log.error_message
        assert email_log.sent_at is None
    else:
        assert email_log.sent_at is not None
        assert email_log.error_message is None


def test_send_email_raises_stored_transport_error() -> None:
    response = SMTPResponse(exception=ConnectionError("SMTP connection failed"))
    with patch("app.utils.emails.Message") as message:
        message.return_value.send.return_value = response
        with pytest.raises(ConnectionError, match="SMTP connection failed"):
            send_email(email_to="recipient@example.com")


def test_send_email_rejects_missing_response() -> None:
    with patch("app.utils.emails.Message") as message:
        message.return_value.send.return_value = None
        with pytest.raises(RuntimeError, match="no response"):
            send_email(email_to="recipient@example.com")


@pytest.mark.parametrize("code", [250, 530])
def test_enquiry_response_waits_for_smtp(code: int) -> None:
    enquiries.reset_rate_limits()
    session = MagicMock()
    background = BackgroundTasks()
    payload = ContactEnquiryCreate(
        name="Visitor", email="visitor@example.com", message="Hello"
    )
    with (
        patch.object(enquiries, "settings") as settings,
        patch("app.utils.emails.Message") as message,
    ):
        settings.emails_enabled = True
        settings.CONTACT_FORM_EMAIL = "karl@ubdm.io"
        message.return_value.send.return_value = smtp_response(code)

        def submit():
            return enquiries.submit_enquiry(
                session=session,
                request=Request({"type": "http", "client": ("127.0.0.1", 1234)}),
                background_tasks=background,
                enquiry_in=payload,
            )

        if code == 530:
            with pytest.raises(HTTPException) as exc:
                submit()
            assert exc.value.status_code == 503
            assert "karl@ubdm.io" in exc.value.detail
            assert not background.tasks
        else:
            assert "Thank you" in submit().message
            assert len(background.tasks) == 1
        message.return_value.send.assert_called_once()
