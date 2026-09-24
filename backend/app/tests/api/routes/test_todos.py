import uuid

from fastapi.testclient import TestClient

from app.core.config import settings

TODOS_URL = f"{settings.API_V1_STR}/todos/"


def create_todo(
    client: TestClient, headers: dict[str, str], **kwargs: object
) -> dict:
    data: dict[str, object] = {"title": f"Todo {uuid.uuid4()}"}
    data.update(kwargs)
    response = client.post(TODOS_URL, headers=headers, json=data)
    assert response.status_code == 200
    return response.json()


def test_create_todo(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "title": "Foo",
        "description": "Fighters",
        "deadline": "2026-12-31T12:00:00",
    }
    response = client.post(
        TODOS_URL, headers=superuser_token_headers, json=data
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert content["deadline"].startswith("2026-12-31T12:00:00")
    assert content["related_ids"] == []
    assert "id" in content
    assert "position" in content


def test_create_todo_forbidden_for_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.post(
        TODOS_URL,
        headers=normal_user_token_headers,
        json={"title": "Foo"},
    )
    assert response.status_code == 403


def test_read_todos_unauthorized(client: TestClient) -> None:
    response = client.get(TODOS_URL)
    assert response.status_code == 401


def test_read_todos_ordered_by_position(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    todo_b = create_todo(client, superuser_token_headers)
    response = client.get(TODOS_URL, headers=superuser_token_headers)
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 2
    positions = [t["position"] for t in content["data"]]
    assert positions == sorted(positions)
    ids = [t["id"] for t in content["data"]]
    assert ids == [todo_a["id"], todo_b["id"]]


def test_create_todo_with_relations(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    todo_b = create_todo(
        client, superuser_token_headers, related_ids=[todo_a["id"]]
    )
    assert todo_b["related_ids"] == [todo_a["id"]]
    # the relation is visible from both sides
    response = client.get(TODOS_URL, headers=superuser_token_headers)
    todos = {t["id"]: t for t in response.json()["data"]}
    assert todos[todo_a["id"]]["related_ids"] == [todo_b["id"]]


def test_create_todo_related_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        TODOS_URL,
        headers=superuser_token_headers,
        json={"title": "Foo", "related_ids": [str(uuid.uuid4())]},
    )
    assert response.status_code == 404


def test_update_todo(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo = create_todo(client, superuser_token_headers)
    response = client.patch(
        f"{TODOS_URL}{todo['id']}",
        headers=superuser_token_headers,
        json={"title": "Bar", "deadline": None},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == "Bar"
    assert content["deadline"] is None


def test_update_todo_relations(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    todo_b = create_todo(client, superuser_token_headers)
    response = client.patch(
        f"{TODOS_URL}{todo_a['id']}",
        headers=superuser_token_headers,
        json={"related_ids": [todo_b["id"]]},
    )
    assert response.status_code == 200
    assert response.json()["related_ids"] == [todo_b["id"]]
    # self-relations are ignored
    response = client.patch(
        f"{TODOS_URL}{todo_a['id']}",
        headers=superuser_token_headers,
        json={"related_ids": [todo_a["id"]]},
    )
    assert response.status_code == 200
    assert response.json()["related_ids"] == []


def test_update_todo_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.patch(
        f"{TODOS_URL}{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"title": "Bar"},
    )
    assert response.status_code == 404


def test_reorder_todos(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    todo_b = create_todo(client, superuser_token_headers)
    todo_c = create_todo(client, superuser_token_headers)
    ordered_ids = [todo_c["id"], todo_a["id"], todo_b["id"]]
    response = client.post(
        f"{TODOS_URL}reorder",
        headers=superuser_token_headers,
        json={"ordered_ids": ordered_ids},
    )
    assert response.status_code == 200
    content = response.json()
    assert [t["id"] for t in content["data"]] == ordered_ids
    response = client.get(TODOS_URL, headers=superuser_token_headers)
    assert [t["id"] for t in response.json()["data"]] == ordered_ids


def test_reorder_todos_incomplete_ids(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    create_todo(client, superuser_token_headers)
    response = client.post(
        f"{TODOS_URL}reorder",
        headers=superuser_token_headers,
        json={"ordered_ids": [todo_a["id"]]},
    )
    assert response.status_code == 400
    response = client.post(
        f"{TODOS_URL}reorder",
        headers=superuser_token_headers,
        json={"ordered_ids": [todo_a["id"], todo_a["id"], str(uuid.uuid4())]},
    )
    assert response.status_code == 400


def test_delete_todo(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    todo_a = create_todo(client, superuser_token_headers)
    todo_b = create_todo(
        client, superuser_token_headers, related_ids=[todo_a["id"]]
    )
    response = client.delete(
        f"{TODOS_URL}{todo_a['id']}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    todos = client.get(TODOS_URL, headers=superuser_token_headers).json()["data"]
    assert [t["id"] for t in todos] == [todo_b["id"]]
    assert todos[0]["related_ids"] == []


def test_delete_todo_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{TODOS_URL}{uuid.uuid4()}", headers=superuser_token_headers
    )
    assert response.status_code == 404
