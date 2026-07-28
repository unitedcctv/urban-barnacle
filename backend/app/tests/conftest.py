from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import EmailLog, Item, ItemImage, Producer, ProducerImage, Review, User
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers


def clear_database(session: Session) -> None:
    session.rollback()
    for model in (ProducerImage, Review, ItemImage, Item, EmailLog, Producer, User):
        session.execute(delete(model))
    session.commit()


@pytest.fixture(autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        clear_database(session)
        init_db(session)
        yield session
        clear_database(session)


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
