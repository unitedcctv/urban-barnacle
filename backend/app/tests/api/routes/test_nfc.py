from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.core.nfc import (
    FILE_READ_KEY_LABEL,
    META_READ_KEY_LABEL,
    compute_sdm_mac,
    derive_key,
    encrypt_picc_data,
)
from app.models import NfcTag, NfcTagStatus
from app.tests.utils.item import create_random_item

TEST_MASTER_KEY = "000102030405060708090A0B0C0D0E0F"
TEST_UID = "04A1B2C3D4E5F6"


@pytest.fixture(autouse=True)
def nfc_master_key() -> Generator[None, None, None]:
    original = settings.NFC_MASTER_KEY
    settings.NFC_MASTER_KEY = TEST_MASTER_KEY
    yield
    settings.NFC_MASTER_KEY = original


def simulate_tap(uid_hex: str, counter: int) -> dict[str, str]:
    """Generate picc/cmac query params exactly as a genuine tag would."""
    master = bytes.fromhex(TEST_MASTER_KEY)
    uid = bytes.fromhex(uid_hex)
    meta_key = derive_key(master, META_READ_KEY_LABEL, uid)
    file_key = derive_key(master, FILE_READ_KEY_LABEL, uid)
    picc = encrypt_picc_data(meta_key, uid, counter)
    cmac = compute_sdm_mac(file_key, uid, counter.to_bytes(3, "little"))
    return {
        "uid": uid_hex,
        "picc": picc.hex().upper(),
        "cmac": cmac.hex().upper(),
    }


def register_test_tag(db: Session) -> NfcTag:
    item = create_random_item(db)
    tag = NfcTag(uid=TEST_UID, item_id=item.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def test_register_tag(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.post(
        f"{settings.API_V1_STR}/nfc/tags",
        headers=superuser_token_headers,
        json={"uid": TEST_UID.lower(), "item_id": str(item.id)},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == TEST_UID  # normalized to uppercase
    assert data["item_id"] == str(item.id)
    assert data["status"] == NfcTagStatus.ACTIVE
    assert data["last_read_counter"] is None


def test_register_tag_requires_auth(client: TestClient, db: Session) -> None:
    item = create_random_item(db)
    response = client.post(
        f"{settings.API_V1_STR}/nfc/tags",
        json={"uid": TEST_UID, "item_id": str(item.id)},
    )
    assert response.status_code == 401


def test_register_duplicate_tag_rejected(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    tag = register_test_tag(db)
    response = client.post(
        f"{settings.API_V1_STR}/nfc/tags",
        headers=superuser_token_headers,
        json={"uid": TEST_UID, "item_id": str(tag.item_id)},
    )
    assert response.status_code == 409


def test_verify_tap_redirects_to_item(client: TestClient, db: Session) -> None:
    tag = register_test_tag(db)
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=simulate_tap(TEST_UID, counter=1),
        follow_redirects=False,
    )
    assert response.status_code == 307
    location = response.headers["location"]
    assert location == (
        f"{settings.FRONTEND_HOST}/item?id={tag.item_id}&verified=true&tap=1"
    )
    db.refresh(tag)
    assert tag.last_read_counter == 1


def test_verify_unknown_tag_fails(client: TestClient) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=simulate_tap(TEST_UID, counter=1),
        follow_redirects=False,
    )
    assert response.status_code == 307
    assert response.headers["location"] == (
        f"{settings.FRONTEND_HOST}/verification-failed"
    )


def test_verify_invalid_cmac_fails(client: TestClient, db: Session) -> None:
    register_test_tag(db)
    params = simulate_tap(TEST_UID, counter=1)
    params["cmac"] = "0000000000000000"
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=params,
        follow_redirects=False,
    )
    assert response.headers["location"] == (
        f"{settings.FRONTEND_HOST}/verification-failed"
    )


def test_verify_replay_rejected(client: TestClient, db: Session) -> None:
    tag = register_test_tag(db)
    # First tap succeeds
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=simulate_tap(TEST_UID, counter=5),
        follow_redirects=False,
    )
    assert "verified=true" in response.headers["location"]
    # Replaying the same (or an older) counter fails
    for stale_counter in (5, 4):
        response = client.get(
            f"{settings.API_V1_STR}/nfc/verify",
            params=simulate_tap(TEST_UID, counter=stale_counter),
            follow_redirects=False,
        )
        assert response.headers["location"] == (
            f"{settings.FRONTEND_HOST}/verification-failed"
        )
    db.refresh(tag)
    assert tag.last_read_counter == 5


def test_revoked_tag_fails(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    register_test_tag(db)
    response = client.delete(
        f"{settings.API_V1_STR}/nfc/tags/{TEST_UID}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=simulate_tap(TEST_UID, counter=1),
        follow_redirects=False,
    )
    assert response.headers["location"] == (
        f"{settings.FRONTEND_HOST}/verification-failed"
    )


def test_list_tags(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    register_test_tag(db)
    response = client.get(
        f"{settings.API_V1_STR}/nfc/tags",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["uid"] == TEST_UID


def test_verify_disabled_without_master_key(client: TestClient) -> None:
    settings.NFC_MASTER_KEY = None
    response = client.get(
        f"{settings.API_V1_STR}/nfc/verify",
        params=simulate_tap(TEST_UID, counter=1),
        follow_redirects=False,
    )
    assert response.status_code == 503
