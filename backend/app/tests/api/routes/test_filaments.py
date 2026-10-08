import uuid

from fastapi.testclient import TestClient

from app.core.config import settings


def _filament_payload(**overrides) -> dict:
    payload = {
        "colour": "Galaxy Blue",
        "colour_hex": "#1E3A8A",
        "material": "PETG",
        "spools": 2.5,
        "manufacturer": "Prusament",
        "price": 29.99,
        "purchase_url": "https://www.prusa3d.com/product/prusament-petg-galaxy-blue-1kg/",
    }
    payload.update(overrides)
    return payload


def _create_filament(
    client: TestClient, superuser_token_headers: dict[str, str], **overrides
) -> dict:
    response = client.post(
        f"{settings.API_V1_STR}/filaments/",
        headers=superuser_token_headers,
        json=_filament_payload(**overrides),
    )
    assert response.status_code == 200
    return response.json()


def test_filament_crud(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    filament = _create_filament(client, superuser_token_headers)
    assert filament["colour"] == "Galaxy Blue"
    assert filament["material"] == "PETG"
    assert filament["spools"] == 2.5
    assert "id" in filament

    # List returns the created entry
    response = client.get(
        f"{settings.API_V1_STR}/filaments/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert filament["id"] in [f["id"] for f in content["data"]]

    # Update spool count and colour
    response = client.patch(
        f"{settings.API_V1_STR}/filaments/{filament['id']}",
        headers=superuser_token_headers,
        json={"spools": 1.0, "colour": "Jet Black", "colour_hex": "#000000"},
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["spools"] == 1.0
    assert updated["colour"] == "Jet Black"
    assert updated["material"] == "PETG"

    # Delete removes it
    response = client.delete(
        f"{settings.API_V1_STR}/filaments/{filament['id']}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    response = client.get(
        f"{settings.API_V1_STR}/filaments/", headers=superuser_token_headers
    )
    assert filament["id"] not in [f["id"] for f in response.json()["data"]]


def test_filament_invalid_colour_hex(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/filaments/",
        headers=superuser_token_headers,
        json=_filament_payload(colour_hex="blue"),
    )
    assert response.status_code == 422


def test_filament_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.patch(
        f"{settings.API_V1_STR}/filaments/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"spools": 5},
    )
    assert response.status_code == 404
    response = client.delete(
        f"{settings.API_V1_STR}/filaments/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_filament_requires_superuser(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/filaments/", headers=normal_user_token_headers
    )
    assert response.status_code == 403
    response = client.post(
        f"{settings.API_V1_STR}/filaments/",
        headers=normal_user_token_headers,
        json=_filament_payload(),
    )
    assert response.status_code == 403


def test_filament_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/filaments/")
    assert response.status_code == 401
