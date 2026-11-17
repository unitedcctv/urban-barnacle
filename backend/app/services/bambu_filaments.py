"""Read Bambu's public EU catalogue without following regional redirects."""

import json
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlparse

import httpx
from pydantic import BaseModel, Field

from app.models import Filament, FilamentMaterial

PRODUCT_URL = "https://eu.store.bambulab.com/de/products/petg-basic"
PRODUCT_NAME = "PETG Basic"
EU_HOST = "eu.store.bambulab.com"


class CatalogueError(ValueError):
    pass


class _ProductScripts(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.scripts: list[str] = []
        self._parts: list[str] = []
        self._capture = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "script":
            self._capture = dict(attrs).get("type") == "application/ld+json"
            self._parts = []

    def handle_data(self, data: str) -> None:
        if self._capture:
            self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._capture:
            self.scripts.append("".join(self._parts))
            self._capture = False


class _Offer(BaseModel):
    url: str
    priceCurrency: str
    price: float = Field(ge=0, allow_inf_nan=False)
    availability: str


class _Variant(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    name: str
    offers: _Offer


def _is_eu_product(url: str) -> bool:
    parsed = urlparse(url)
    return (
        parsed.scheme == "https"
        and parsed.netloc == EU_HOST
        and parsed.path in ("/products/petg-basic", "/de/products/petg-basic")
    )


def parse_catalogue(html: str) -> list[Filament]:
    parser = _ProductScripts()
    parser.feed(html)
    try:
        groups: list[dict[str, Any]] = []
        for script in parser.scripts:
            document = json.loads(script)
            documents = document if isinstance(document, list) else [document]
            groups.extend(
                item
                for item in documents
                if isinstance(item, dict)
                and item.get("@type") == "ProductGroup"
                and item.get("name") == PRODUCT_NAME
            )
        if len(groups) != 1:
            raise CatalogueError("The PETG Basic catalogue was not found.")
        group = groups[0]
        if not _is_eu_product(group.get("url", "")):
            raise CatalogueError("The supplier returned a non-EU catalogue.")
        variants = group.get("hasVariant")
        if not isinstance(variants, list) or not variants:
            raise CatalogueError("The supplier returned no filament variants.")
        product = {key: value for key, value in group.items() if key != "hasVariant"}
        filaments = []
        seen = set()
        for raw in variants:
            variant = _Variant.model_validate(raw)
            offer = variant.offers
            if offer.priceCurrency != "EUR" or not _is_eu_product(offer.url):
                raise CatalogueError("The supplier returned non-EU variant data.")
            prefix = f"{PRODUCT_NAME} - "
            if not variant.name.startswith(prefix):
                raise CatalogueError("Unexpected filament variant name.")
            colour, packaging, weight = variant.name.removeprefix(prefix).split(" / ")
            status_url = urlparse(offer.availability)
            status = status_url.path.removeprefix("/")
            if status_url.netloc != "schema.org" or status not in {
                "InStock",
                "OutOfStock",
                "SoldOut",
                "LimitedAvailability",
                "PreOrder",
                "PreSale",
                "BackOrder",
                "Discontinued",
            }:
                raise CatalogueError("Unrecognised supplier availability.")
            if variant.sku in seen:
                raise CatalogueError("Duplicate supplier variant.")
            seen.add(variant.sku)
            filaments.append(
                Filament.model_validate(
                    {
                        "colour": colour.strip(),
                        "material": FilamentMaterial.PETG,
                        "manufacturer": "Bambu Lab",
                        "price": offer.price,
                        "purchase_url": f"{PRODUCT_URL}?id={variant.sku}",
                        "product_name": PRODUCT_NAME,
                        "variant_name": f"{packaging} / {weight}",
                        "supplier_sku": variant.sku,
                        "supplier_availability": status,
                        "supplier_data": {"product": product, "variant": raw},
                    }
                )
            )
        return filaments
    except (ValueError, TypeError, KeyError) as exc:
        raise CatalogueError(
            "The EU supplier data could not be validated. No stock was changed."
        ) from exc


def fetch_catalogue() -> list[Filament]:
    # This is the store's region-selection cookie. Never accept a UK redirect,
    # even when the server or the administrator uses a VPN.
    response = httpx.get(
        PRODUCT_URL,
        cookies={"skr": "yes", "NEXT_LOCALE": "de"},
        follow_redirects=False,
        timeout=30,
    )
    response.raise_for_status()
    return parse_catalogue(response.text)
