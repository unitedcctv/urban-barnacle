import { type Page, expect, test } from "@playwright/test"
import type { ItemPublic } from "../src/client"

test.use({ storageState: { cookies: [], origins: [] } })

const image = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#507080"/></svg>',
)}`

function item(index: number, imageUrls = [image]): ItemPublic {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    owner_id: "00000000-0000-4000-8000-000000000000",
    title: `Piece ${index}`,
    description: `Description ${index}`,
    image_urls: imageUrls,
  }
}

async function mockItems(page: Page, items: ItemPublic[]) {
  await page.route("**/api/v1/items/?*", (route) => {
    const params = new URL(route.request().url()).searchParams
    const skip = Number(params.get("skip"))
    const limit = Number(params.get("limit"))
    return route.fulfill({
      json: { data: items.slice(skip, skip + limit), count: items.length },
    })
  })
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/navigation/", (route) =>
    route.fulfill({
      json: [{ title: "Gallery", path: "/items", icon: "gallery" }],
    }),
  )
})

test("desktop opens with the logo, then scrolls through the selected images", async ({
  page,
}) => {
  await mockItems(page, [
    item(1),
    item(2, []),
    item(3),
    item(4),
    item(5),
    item(6),
  ])
  await page.goto("/")

  const logo = page.getByAltText("Urban Barnacle logo", { exact: true })
  const cue = page.getByRole("button", { name: "Scroll to explore" })
  const first = page.getByRole("heading", { name: "Piece 1", exact: true })
  await expect(logo).toBeInViewport()
  await expect(logo).toHaveCSS("filter", "none")
  await expect(cue).toBeInViewport()
  await expect(page.getByRole("region", { name: "Welcome" })).toHaveCSS(
    "height",
    `${page.viewportSize()!.height}px`,
  )
  await expect(first).not.toBeInViewport()
  await expect(page.locator("main").getByRole("heading")).toHaveText([
    "Piece 1",
    "Piece 3",
    "Piece 4",
    "Piece 5",
  ])
  const cueBox = await cue.boundingBox()
  const footerBox = await page
    .getByRole("contentinfo")
    .filter({ hasText: "Impressum" })
    .boundingBox()
  expect(cueBox!.y + cueBox!.height).toBeLessThan(footerBox!.y)

  await cue.click()
  await expect(first).toBeInViewport()
  await expect(logo).not.toBeInViewport()
  const panel = first.locator("../..")
  await expect(panel).toHaveCSS("background-attachment", "fixed")
  await expect(panel).toHaveCSS("background-size", "cover")
  await expect(panel).toHaveCSS("height", `${page.viewportSize()!.height}px`)
  const panelBox = await panel.boundingBox()
  const captionBox = await first.locator("..").boundingBox()
  expect(captionBox!.y).toBeGreaterThanOrEqual(panelBox!.y)
  expect(captionBox!.y + captionBox!.height).toBeLessThanOrEqual(
    panelBox!.y + panelBox!.height,
  )
  await page
    .getByRole("heading", { name: "Piece 3", exact: true })
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByText("Description 3", { exact: true }),
  ).toBeInViewport()
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(logo).toBeInViewport()
})

for (const [name, items] of [
  ["empty", []],
  ["imageless", [item(1, []), item(2, [""])]],
] as const) {
  test(`desktop keeps the holding page without a cue for ${name} items`, async ({
    page,
  }) => {
    await mockItems(page, [...items])
    const response = page.waitForResponse("**/api/v1/items/?*")
    await page.goto("/")
    await response
    await expect(
      page.getByAltText("Urban Barnacle logo", { exact: true }),
    ).toBeInViewport()
    await expect(page.getByAltText("Loading...", { exact: true })).toHaveCount(
      0,
    )
    await expect(
      page.getByRole("button", { name: "Scroll to explore" }),
    ).toHaveCount(0)
    await expect(page.locator("main").getByRole("heading")).toHaveCount(0)
  })
}

test("the holding page stays first while images load", async ({ page }) => {
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route("**/api/v1/items/?*", async (route) => {
    await pending
    await route.fulfill({ json: { data: [item(1)], count: 1 } })
  })
  await page.goto("/")
  try {
    await expect(
      page.getByAltText("Urban Barnacle logo", { exact: true }),
    ).toBeInViewport()
    await expect(
      page.getByAltText("Loading...", { exact: true }),
    ).toBeAttached()
    await expect(
      page.getByRole("button", { name: "Scroll to explore" }),
    ).toHaveCount(0)
  } finally {
    release()
  }
  await expect(
    page.getByRole("button", { name: "Scroll to explore" }),
  ).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test("an API error keeps the introduction and existing error feedback", async ({
  page,
}) => {
  await page.route("**/api/v1/items/?*", (route) =>
    route.fulfill({ status: 500, json: { detail: "Unavailable" } }),
  )
  await page.goto("/")
  await expect(
    page.getByAltText("Urban Barnacle logo", { exact: true }),
  ).toBeInViewport()
  await expect(
    page.getByText("Something went wrong.", { exact: true }),
  ).toBeAttached({
    timeout: 15000,
  })
  await expect(
    page.getByRole("button", { name: "Scroll to explore" }),
  ).toHaveCount(0)
})

test("keyboard scrolling respects reduced motion and the desktop navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await mockItems(page, [item(1)])
  await page.goto("/")
  const cue = page.getByRole("button", { name: "Scroll to explore" })
  await cue.focus()
  await page.keyboard.press("Enter")
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(page.viewportSize()!.height - 52)
  await expect(
    page.getByRole("heading", { name: "Piece 1", exact: true }),
  ).toBeInViewport()
})

test.describe("mobile", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  test("keeps the grid, pagination and item navigation below the logo", async ({
    page,
  }) => {
    const items = Array.from({ length: 21 }, (_, index) => item(index + 1))
    const requests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/items/?"))
        requests.push(request.url())
    })
    await mockItems(page, items)
    await page.route(`**/api/v1/items/${items[0].id}`, (route) =>
      route.fulfill({ json: { item: items[0], can_edit: false } }),
    )
    await page.goto("/")
    await expect(
      page.getByAltText("Urban Barnacle logo", { exact: true }),
    ).toBeInViewport()
    const first = page.getByRole("heading", { name: "Piece 1", exact: true })
    await expect(first).not.toBeInViewport()
    await page.getByRole("button", { name: "Scroll to explore" }).click()
    await expect(first).toBeInViewport()
    await expect(page.locator(".grid-item")).toHaveCount(20)
    await page
      .getByRole("heading", { name: "Piece 20", exact: true })
      .scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator(".grid-item")).toHaveCount(21)
    expect(
      requests.every((url) => new URL(url).searchParams.get("limit") === "20"),
    ).toBe(true)
    await first.click()
    await expect(page).toHaveURL(new RegExp(`/item\\?id=${items[0].id}`))
    await expect(first).toBeVisible()
  })

  test("hides the cue for an empty gallery", async ({ page }) => {
    await mockItems(page, [])
    await page.goto("/")
    await expect(
      page.getByAltText("Urban Barnacle logo", { exact: true }),
    ).toBeInViewport()
    await expect(page.locator(".grid-item")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Scroll to explore" }),
    ).toHaveCount(0)
  })

  test("still offers the gallery when its cards have no images", async ({
    page,
  }) => {
    await mockItems(page, [item(1, [])])
    await page.goto("/")
    await page.getByRole("button", { name: "Scroll to explore" }).click()
    await expect(
      page.getByRole("heading", { name: "Piece 1", exact: true }),
    ).toBeInViewport()
  })
})

for (const [width, height] of [
  [320, 600],
  [479, 600],
  [480, 600],
  [1024, 600],
  [844, 390],
]) {
  test(`logo and cue fit at ${width}x${height} in dark mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    await page.addInitScript(() =>
      localStorage.setItem("chakra-ui-color-mode", "dark"),
    )
    await mockItems(page, [item(1)])
    await page.goto("/")
    const logo = page.getByAltText("Urban Barnacle logo", { exact: true })
    await expect(logo).toBeInViewport({ ratio: 1 })
    await expect(logo).toHaveCSS("filter", "invert(1)")
    const cue = page.getByRole("button", { name: "Scroll to explore" })
    await expect(cue).toBeInViewport({ ratio: 1 })
    const cueBox = await cue.boundingBox()
    const logoBox = await logo.boundingBox()
    const footerBox = await page
      .getByRole("contentinfo")
      .filter({ hasText: "Impressum" })
      .boundingBox()
    expect(logoBox!.y).toBeGreaterThanOrEqual(width >= 480 ? 52 : 0)
    expect(logoBox!.y + logoBox!.height).toBeLessThanOrEqual(cueBox!.y)
    expect(cueBox!.y + cueBox!.height).toBeLessThan(footerBox!.y)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    await expect(page.locator(".grid-item")).toHaveCount(width < 480 ? 1 : 0)
  })
}

test("resizing across the gallery breakpoint keeps the introduction first", async ({
  page,
}) => {
  await mockItems(page, [item(1)])
  await page.goto("/")
  const cue = page.getByRole("button", { name: "Scroll to explore" })
  await expect(cue).toBeInViewport()
  for (const width of [479, 480, 390]) {
    await page.setViewportSize({ width, height: 700 })
    await expect(page.locator(".grid-item")).toHaveCount(width < 480 ? 1 : 0)
    await expect(cue).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  }
})

test("the standalone gallery does not gain a holding page", async ({
  page,
}) => {
  await mockItems(page, [item(1)])
  await page.goto("/items")
  await expect(
    page.getByRole("heading", { name: "Piece 1", exact: true }),
  ).toBeInViewport()
  await expect(
    page.getByAltText("Urban Barnacle logo", { exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Scroll to explore" }),
  ).toHaveCount(0)
})
