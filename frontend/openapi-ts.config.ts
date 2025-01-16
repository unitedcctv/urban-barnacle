import { defineConfig, defaultPlugins } from "@hey-api/openapi-ts"

export default defineConfig({
  client: "legacy/axios",
  input: "./openapi.json",
  output: "./src/client",
  plugins: [
    ...defaultPlugins,
    {
      name: "@hey-api/sdk",
    },
    {
      name: '@hey-api/schemas',
      type: 'json', 
    },
  ],
})
