import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: "chatwoot.spec.ts",
  use: { baseURL: "http://localhost:5174" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  reporter: "line",
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    env: {
      VITE_CHATWOOT_BASE_URL: "https://chat.example.test",
      VITE_CHATWOOT_WEBSITE_TOKEN: "public-test-token",
    },
  },
})
