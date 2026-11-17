import json
import uuid
from copy import deepcopy

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.bambu_filaments import PRODUCT_URL, CatalogueError, parse_catalogue


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


def _catalogue() -> dict:
    return {
        "@type": "ProductGroup",
        "name": "PETG Basic",
        "url": PRODUCT_URL,
        "description": "Supplier product details",
        "hasVariant": [
            {
                "@type": "Product",
                "sku": f"test-eu-white-{index}",
                "name": f"PETG Basic - Weiß(30106) / {packaging} / 1 kg",
                "image": "https://store.bblcdn.eu/white.png",
                "offers": {
                    "url": f"{PRODUCT_URL}?id=test-eu-white-{index}",
                    "priceCurrency": "EUR",
                    "price": price,
                    "availability": f"https://schema.org/{status}",
                },
            }
            for index, (packaging, price, status) in enumerate(
                [
                    ("Nachfüllpackung", 15.99, "InStock"),
                    ("Filament mit Spule", 18.99, "OutOfStock"),
                ]
            )
        ],
    }


def _html(catalogue: dict) -> str:
    return f'<html><script type="application/ld+json">{json.dumps(catalogue)}</script></html>'


def test_import_refresh_preserves_local_stock(
    client: TestClient, superuser_token_headers: dict[str, str], monkeypatch
) -> None:
    catalogue = _catalogue()

    def get_eu(url, **kwargs):
        assert url == PRODUCT_URL
        assert kwargs["cookies"]["skr"] == "yes"
        assert kwargs["follow_redirects"] is False
        return httpx.Response(
            200, text=_html(catalogue), request=httpx.Request("GET", url)
        )

    monkeypatch.setattr("app.services.bambu_filaments.httpx.get", get_eu)
    headers = superuser_token_headers
    base = f"{settings.API_V1_STR}/filaments"
    manual = _create_filament(client, headers)
    response = client.post(f"{base}/import-bambu-eu", headers=headers)
    assert response.status_code == 200
    assert response.json()["imported"] == 2
    entries = client.get(f"{base}/", headers=headers).json()["data"]
    imported = [entry for entry in entries if entry["supplier_sku"]]
    assert len(imported) == 2
    refill = next(
        entry for entry in imported if entry["supplier_availability"] == "InStock"
    )
    spool = next(
        entry for entry in imported if entry["supplier_availability"] == "OutOfStock"
    )
    assert refill["spools"] == spool["spools"] == 0
    assert refill["supplier_data"]["variant"] == catalogue["hasVariant"][0]
    assert refill["supplier_data"]["product"]["description"] == catalogue["description"]
    assert refill["supplier_checked_at"]
    assert refill["price"] == 15.99

    # Supplier unavailability must not prevent recording stock already at UBDM.
    stock = client.post(
        f"{base}/{spool['id']}/stock", headers=headers, json={"delta": 1}
    )
    assert stock.status_code == 200
    assert stock.json()["spools"] == 1
    client.patch(
        f"{base}/{spool['id']}", headers=headers, json={"colour_hex": "#FFFFFF"}
    )
    catalogue["hasVariant"][1]["offers"]["availability"] = "https://schema.org/InStock"
    catalogue["hasVariant"][1]["offers"]["price"] = 17.99
    assert client.post(f"{base}/import-bambu-eu", headers=headers).status_code == 200
    refreshed = client.get(f"{base}/", headers=headers).json()["data"]
    assert len(refreshed) == 3
    updated = next(entry for entry in refreshed if entry["id"] == spool["id"])
    assert updated["spools"] == 1
    assert updated["colour_hex"] == "#FFFFFF"
    assert updated["price"] == 17.99
    assert updated["supplier_availability"] == "InStock"
    assert next(entry for entry in refreshed if entry["id"] == manual["id"]) == manual

    # A malformed/foreign response must not partially update the inventory.
    before_failure = deepcopy(refreshed)
    catalogue["hasVariant"][1]["offers"]["priceCurrency"] = "GBP"
    assert client.post(f"{base}/import-bambu-eu", headers=headers).status_code == 502
    assert client.get(f"{base}/", headers=headers).json()["data"] == before_failure

    # Removed variants keep their local stock, but lose their old availability.
    catalogue["hasVariant"].pop()
    assert client.post(f"{base}/import-bambu-eu", headers=headers).status_code == 200
    missing = next(
        entry
        for entry in client.get(f"{base}/", headers=headers).json()["data"]
        if entry["id"] == spool["id"]
    )
    assert missing["supplier_availability"] == "NotListed"
    assert missing["spools"] == 1


@pytest.mark.parametrize("failure", ["uk", "currency", "empty", "duplicate", "status"])
def test_catalogue_rejects_invalid_data(failure: str) -> None:
    catalogue = _catalogue()
    if failure == "uk":
        catalogue["url"] = "https://uk.store.bambulab.com/products/petg-basic"
    elif failure == "currency":
        catalogue["hasVariant"][0]["offers"]["priceCurrency"] = "GBP"
    elif failure == "empty":
        catalogue["hasVariant"] = []
    elif failure == "duplicate":
        catalogue["hasVariant"].append(catalogue["hasVariant"][0])
    else:
        catalogue["hasVariant"][0]["offers"]["availability"] = "Unknown"
    with pytest.raises(CatalogueError):
        parse_catalogue(_html(catalogue))


@pytest.mark.parametrize("status", [302, 503])
def test_import_supplier_failure(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    monkeypatch,
    status: int,
) -> None:
    monkeypatch.setattr(
        "app.services.bambu_filaments.httpx.get",
        lambda url, **kwargs: httpx.Response(
            status,
            request=httpx.Request("GET", url),
            headers={"Location": "https://uk.store.bambulab.com/products/petg-basic"},
        ),
    )
    response = client.post(
        f"{settings.API_V1_STR}/filaments/import-bambu-eu",
        headers=superuser_token_headers,
    )
    assert response.status_code == 502


def test_adjust_local_stock(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    headers = superuser_token_headers
    filament = _create_filament(client, headers, spools=0)
    url = f"{settings.API_V1_STR}/filaments/{filament['id']}/stock"
    for delta, expected in [(1, 1), (1, 2), (-0.5, 1.5), (-2, 0)]:
        response = client.post(url, headers=headers, json={"delta": delta})
        assert response.status_code == 200
        assert response.json()["spools"] == expected
    assert client.post(url, headers=headers, json={"delta": 1001}).status_code == 422
    assert (
        client.post(
            f"{settings.API_V1_STR}/filaments/{uuid.uuid4()}/stock",
            headers=headers,
            json={"delta": 1},
        ).status_code
        == 404
    )


def test_import_and_stock_require_superuser(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    for path, body in [
        ("import-bambu-eu", None),
        (f"{uuid.uuid4()}/stock", {"delta": 1}),
    ]:
        url = f"{settings.API_V1_STR}/filaments/{path}"
        assert client.post(url, json=body).status_code == 401
        assert (
            client.post(url, headers=normal_user_token_headers, json=body).status_code
            == 403
        )
