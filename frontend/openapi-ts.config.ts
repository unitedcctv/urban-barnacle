import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  client: "@hey-api/client-fetch",
  input: "./openapi.json",
  output: "./src/client",
  plugins: [
    ...defaultPlugins,
    {
      name: "@hey-api/sdk",
      responseStyle: "data",
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
  ],
})
