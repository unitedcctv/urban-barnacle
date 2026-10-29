import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/navigation/", (route) =>
    route.fulfill({ json: [] }),
  )
})

for (const width of [375, 1280]) {
  test(`loads chat on demand without duplicate SDK loads at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 })
    let loads = 0
    await page.route("https://chat.example.test/packs/js/sdk.js", (route) => {
      loads++
      return route.fulfill({
        contentType: "application/javascript",
        body: `window.chatwootSDK = { run(options) {
          window.__chatOptions = options;
          window.$chatwoot = { toggle(state) { window.__chatState = state; } };
          window.dispatchEvent(new Event('chatwoot:ready'));
        } };`,
      })
    })
    await page.goto("/contact")
    const launcher = page.getByRole("button", { name: "Chat with us" })
    await expect(launcher).toBeVisible()
    expect(loads).toBe(0)
    const box = await launcher.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.y + box!.height).toBeLessThanOrEqual(736)
    await launcher.click()
    await expect.poll(() => page.evaluate("window.__chatState")).toBe("open")
    expect(await page.evaluate("window.__chatOptions")).toEqual({
      websiteToken: "public-test-token",
      baseUrl: "https://chat.example.test",
    })
    await launcher.click()
    expect(loads).toBe(1)
  })
}

test("offers direct email when the chat server cannot be reached", async ({
  page,
}) => {
  await page.route("https://chat.example.test/packs/js/sdk.js", (route) =>
    route.abort(),
  )
  await page.goto("/contact")
  await page.getByRole("button", { name: "Chat with us" }).click()
  const error = page
    .getByRole("alert")
    .filter({ hasText: "chat is unavailable" })
  await expect(error).toBeVisible()
  await expect(error.getByRole("link")).toHaveAttribute(
    "href",
    "mailto:karl@ubdm.io",
  )
  await expect(page.getByRole("button", { name: "Chat with us" })).toBeEnabled()
})
