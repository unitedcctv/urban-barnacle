import logging
from collections import deque

import pytest

from app.api.routes import logs


@pytest.fixture(autouse=True)
def db() -> None:
    """Logging tests do not need Postgres."""


@pytest.mark.parametrize("server_propagates", [False, True])
def test_log_buffer_captures_once_after_repeated_setup(
    monkeypatch: pytest.MonkeyPatch, server_propagates: bool
) -> None:
    buffer = deque(maxlen=1000)
    monkeypatch.setattr(logs, "log_buffer", buffer)
    names = ["", "app", "app.utils", "uvicorn", "uvicorn.error", "uvicorn.access"]
    loggers = [logging.getLogger(name) for name in names]
    original = [(logger, logger.handlers[:], logger.level, logger.propagate) for logger in loggers]
    try:
        logging.getLogger("app").propagate = True
        logging.getLogger("app.utils").propagate = True
        logging.getLogger("uvicorn").propagate = server_propagates
        logging.getLogger("uvicorn.error").propagate = True
        logging.getLogger("uvicorn.access").propagate = False
        logs.setup_log_buffer()
        logs.setup_log_buffer()
        for name in ["app.utils", "uvicorn.error", "uvicorn.access"]:
            logging.getLogger(name).warning("Repeated message")
            logging.getLogger(name).warning("Repeated message")

        # Distinct events with identical text must still be retained.
        assert [entry["logger"] for entry in buffer] == [
            "app.utils", "app.utils",
            "uvicorn.error", "uvicorn.error",
            "uvicorn.access", "uvicorn.access",
        ]
        for logger, handlers, _, _ in original:
            assert all(handler in logger.handlers for handler in handlers if not isinstance(handler, logs.LogBufferHandler))
    finally:
        for logger, handlers, level, propagate in original:
            logger.handlers = handlers
            logger.setLevel(level)
            logger.propagate = propagate
