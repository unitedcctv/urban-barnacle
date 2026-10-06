import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.tests.utils.item import create_random_item


def test_create_item(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"title": "Foo", "description": "Fighters"}
    response = client.post(
        f"{settings.API_V1_STR}/items/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert "id" in content
    assert "owner_id" in content


def test_read_item(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.get(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()["item"]
    assert content["title"] == item.title
    assert content["description"] == item.description
    assert content["id"] == str(item.id)
    assert content["owner_id"] == str(item.owner_id)


def test_read_item_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/items/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Item not found"


def test_read_item_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.get(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["can_edit"] is False


def test_read_items(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_item(db)
    create_random_item(db)
    response = client.get(
        f"{settings.API_V1_STR}/items/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_item(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    data = {"title": "Updated title", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert content["id"] == str(item.id)
    assert content["owner_id"] == str(item.owner_id)


def test_update_item_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"title": "Updated title", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/items/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Item not found"


def test_update_item_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    data = {"title": "Updated title", "description": "Updated description"}
    response = client.put(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_item(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.delete(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Item deleted successfully"


def test_delete_item_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/items/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Item not found"


def test_delete_item_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.delete(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_items_stable_order_after_update(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    items = [create_random_item(db) for _ in range(3)]
    expected_order = [str(item.id) for item in items]

    response = client.get(f"{settings.API_V1_STR}/items/")
    assert response.status_code == 200
    returned = [i["id"] for i in response.json()["data"]]
    assert returned[-3:] == expected_order

    # Updating one item must not change the list order
    response = client.put(
        f"{settings.API_V1_STR}/items/{items[1].id}",
        headers=superuser_token_headers,
        json={"title": "Updated title"},
    )
    assert response.status_code == 200

    response = client.get(f"{settings.API_V1_STR}/items/")
    returned = [i["id"] for i in response.json()["data"]]
    assert returned[-3:] == expected_order


def test_update_item_order(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    items = [create_random_item(db) for _ in range(3)]
    new_order = [str(items[2].id), str(items[0].id), str(items[1].id)]

    response = client.put(
        f"{settings.API_V1_STR}/items/order",
        headers=superuser_token_headers,
        json={"item_ids": new_order},
    )
    assert response.status_code == 200

    response = client.get(f"{settings.API_V1_STR}/items/")
    returned = [i["id"] for i in response.json()["data"]]
    assert returned[:3] == new_order

    response = client.put(
        f"{settings.API_V1_STR}/items/order",
        headers=superuser_token_headers,
        json={"item_ids": [new_order[0], new_order[0]]},
    )
    assert response.status_code == 400

    response = client.put(
        f"{settings.API_V1_STR}/items/order",
        headers=superuser_token_headers,
        json={"item_ids": [new_order[0], str(uuid.uuid4())]},
    )
    assert response.status_code == 400


def test_update_item_order_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    item = create_random_item(db)
    response = client.put(
        f"{settings.API_V1_STR}/items/order",
        headers=normal_user_token_headers,
        json={"item_ids": [str(item.id)]},
    )
    assert response.status_code == 400
    content = response.json()
    assert content["detail"] == "Not enough permissions"
