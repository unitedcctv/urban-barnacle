import uuid
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import ItemImage
from app.tests.utils.item import create_random_item


def _create_image(
    db: Session, item_id: uuid.UUID, name: str, created_at: datetime
) -> ItemImage:
    image = ItemImage(
        id=uuid.uuid4(),
        path=f"http://example.com/{name}.webp",
        name=name,
        item_id=item_id,
        created_at=created_at,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def test_update_image_order_persists(
    client: TestClient, db: Session
) -> None:
    item = create_random_item(db)
    now = datetime.utcnow()
    img1 = _create_image(db, item.id, "first", now)
    img2 = _create_image(db, item.id, "second", now + timedelta(seconds=1))
    img3 = _create_image(db, item.id, "third", now + timedelta(seconds=2))

    # Baseline order follows creation time
    response = client.get(f"{settings.API_V1_STR}/images/item/{item.id}")
    assert response.status_code == 200
    assert [i["id"] for i in response.json()["data"]] == [
        str(img1.id),
        str(img2.id),
        str(img3.id),
    ]

    # Reorder and verify it is persisted
    new_order = [str(img3.id), str(img1.id), str(img2.id)]
    response = client.put(
        f"{settings.API_V1_STR}/images/item/{item.id}/order",
        json={"image_ids": new_order},
    )
    assert response.status_code == 200

    response = client.get(f"{settings.API_V1_STR}/images/item/{item.id}")
    assert [i["id"] for i in response.json()["data"]] == new_order

    # The items API (used by the home page) reflects the same order
    response = client.get(f"{settings.API_V1_STR}/items/")
    assert response.status_code == 200
    image_urls = {
        item_data["id"]: item_data["image_urls"]
        for item_data in response.json()["data"]
    }[str(item.id)]
    assert image_urls == [img.path for img in (img3, img1, img2)]


def test_update_image_order_rejects_mismatched_ids(
    client: TestClient, db: Session
) -> None:
    item = create_random_item(db)
    now = datetime.utcnow()
    img1 = _create_image(db, item.id, "first", now)
    _create_image(db, item.id, "second", now + timedelta(seconds=1))

    response = client.put(
        f"{settings.API_V1_STR}/images/item/{item.id}/order",
        json={"image_ids": [str(img1.id), str(uuid.uuid4())]},
    )
    assert response.status_code == 400

    response = client.put(
        f"{settings.API_V1_STR}/images/item/{uuid.uuid4()}/order",
        json={"image_ids": []},
    )
    assert response.status_code == 200  # item with no images: nothing to order
