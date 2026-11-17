import { type Page, expect, test } from "@playwright/test"
import type { FilamentPublic } from "../src/client"

test.use({ storageState: { cookies: [], origins: [] } })

const filament: FilamentPublic = {
  id: "00000000-0000-4000-8000-000000000001",
  colour: "Weiß(30106)",
  material: "PETG",
  manufacturer: "Bambu Lab",
  product_name: "PETG Basic",
  variant_name: "Filament mit Spule / 1 kg",
  supplier_sku: "703100873995440158",
  supplier_availability: "OutOfStock",
  supplier_checked_at: "2026-11-17T19:00:00Z",
  supplier_data: {
    variant: {
      sku: "703100873995440158",
      offers: {
        priceCurrency: "EUR",
        availability: "https://schema.org/OutOfStock",
      },
    },
  },
  price: 18.99,
  spools: 0,
  purchase_url:
    "https://eu.store.bambulab.com/de/products/petg-basic?id=703100873995440158",
  created_at: "2026-11-17T19:00:00Z",
}

async function mockAdmin(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("access_token", "test-token"),
  )
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === "/api/v1/users/me") {
      return route.fulfill({
        json: {
          id: "00000000-0000-4000-8000-000000000002",
          email: "admin@example.com",
          permissions: "superuser",
          is_active: true,
        },
      })
    }
    if (path === "/api/v1/navigation/") return route.fulfill({ json: [] })
    return route.fulfill({ json: { data: [], count: 0 } })
  })
}

test("admin imports EU variants and manages independent local stock", async ({
  page,
}) => {
  await mockAdmin(page)
  let entries: FilamentPublic[] = []
  await page.route("**/api/v1/filaments/", (route) =>
    route.fulfill({ json: { data: entries, count: entries.length } }),
  )
  await page.route("**/api/v1/filaments/import-bambu-eu", (route) => {
    expect(route.request().method()).toBe("POST")
    entries = [{ ...filament, spools: entries[0]?.spools ?? 0 }]
    return route.fulfill({
      json: { imported: 1, checked_at: filament.supplier_checked_at },
    })
  })
  await page.route(`**/api/v1/filaments/${filament.id}/stock`, (route) => {
    expect(route.request().method()).toBe("POST")
    const { delta } = route.request().postDataJSON()
    entries = [
      { ...entries[0], spools: Math.max(0, (entries[0].spools ?? 0) + delta) },
    ]
    return route.fulfill({ json: entries[0] })
  })

  await page.goto("/suadmin")
  await page.getByRole("button", { name: "Import / refresh Bambu EU" }).click()
  await expect(
    page.getByText("1 PETG Basic variants saved.", { exact: false }),
  ).toBeVisible()
  await page.getByRole("link", { name: "Manage Filament" }).click()
  const row = page.getByRole("row").filter({ hasText: "Weiß(30106)" })
  await expect(row.getByText("Out of stock", { exact: true })).toBeVisible()
  await expect(row.getByText("Not in stock locally")).toBeVisible()
  await expect(row.getByText("€18.99")).toBeVisible()
  await expect(row.getByRole("link", { name: "Buy from EU" })).toHaveAttribute(
    "href",
    filament.purchase_url!,
  )
  await row.getByRole("button", { name: "Add 1 locally" }).click()
  await expect(row.getByText("1 spools at UBDM")).toBeVisible()
  await expect(row.getByText("Out of stock", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Import / refresh Bambu EU" }).click()
  await expect(row.getByText("1 spools at UBDM")).toBeVisible()
  await row.getByRole("button", { name: "Details", exact: true }).click()
  const details = page.getByRole("dialog")
  await expect(
    details.getByText("EU variant ID: 703100873995440158"),
  ).toBeVisible()
  await expect(details.locator("pre")).toContainText('"priceCurrency": "EUR"')
  await details.getByRole("button", { name: "Close" }).click()
  await page
    .getByRole("combobox", { name: "Filter stock" })
    .selectOption("local")
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: /Use half a spool/ }).click()
  await expect(row.getByText("0.5 spools at UBDM")).toBeVisible()
  await row.getByRole("button", { name: /Use half a spool/ }).click()
  await expect(
    page.getByText("No filament matches these filters."),
  ).toBeVisible()
  await page.getByRole("combobox", { name: "Filter stock" }).selectOption("all")
  await expect(row.getByText("Not in stock locally")).toBeVisible()
})

test("failed refresh keeps the existing stock visible", async ({ page }) => {
  await mockAdmin(page)
  await page.route("**/api/v1/filaments/", (route) =>
    route.fulfill({ json: { data: [{ ...filament, spools: 2 }], count: 1 } }),
  )
  await page.route("**/api/v1/filaments/import-bambu-eu", (route) =>
    route.fulfill({
      status: 502,
      json: { detail: "Could not retrieve valid Bambu Lab EU stock." },
    }),
  )
  await page.goto("/filament")
  await page.getByRole("button", { name: "Import / refresh Bambu EU" }).click()
  await expect(
    page.getByText("Could not retrieve valid Bambu Lab EU stock."),
  ).toBeVisible()
  await expect(page.getByText("2 spools at UBDM")).toBeVisible()
})
