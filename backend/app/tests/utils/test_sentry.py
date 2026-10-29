import runpy
from unittest.mock import patch

import pytest
import sentry_sdk
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.transport import Transport

from app.core.config import settings


@pytest.fixture(autouse=True)
def db() -> None:
    """This regression test does not use the database."""


@pytest.mark.parametrize("capture_locals", [False, True])
def test_sentry_does_not_break_service_unavailable_response(capture_locals: bool) -> None:
    # Load the production initialization options without connecting to Sentry.
    with (
        patch.object(settings, "ENVIRONMENT", "production"),
        patch.object(settings, "SENTRY_DSN", "https://public@example.com/1"),
        patch("sentry_sdk.init") as initialize,
    ):
        runpy.run_module("app.main", run_name="sentry_config_test")
    options = initialize.call_args.kwargs
    if capture_locals:
        # Also verify Python 3.13 frame serialization without the workaround.
        options["include_local_variables"] = True

    app = FastAPI()

    @app.get("/unavailable")
    def unavailable() -> None:
        raise HTTPException(status_code=503, detail="Please email karl@ubdm.io directly.")

    events = []

    class MemoryTransport(Transport):
        def capture_envelope(self, envelope):
            for item in envelope.items:
                event = item.get_event()
                if event is not None:
                    events.append(event)

    with sentry_sdk.isolation_scope() as scope:
        sentry_client = sentry_sdk.Client(
            **options,
            default_integrations=False,
            integrations=[StarletteIntegration(), FastApiIntegration()],
            transport=MemoryTransport(),
        )
        scope.set_client(sentry_client)
        try:
            with TestClient(app) as client:
                response = client.get("/unavailable")
        finally:
            sentry_client.close()

    assert response.status_code == 503
    assert response.json() == {"detail": "Please email karl@ubdm.io directly."}
    errors = [event for event in events if "exception" in event]
    assert errors, "Sentry should still capture the exception"
    frames = errors[0]["exception"]["values"][0]["stacktrace"]["frames"]
    assert frames
    if capture_locals:
        assert any("vars" in frame for frame in frames)
    else:
        assert all("vars" not in frame for frame in frames)
