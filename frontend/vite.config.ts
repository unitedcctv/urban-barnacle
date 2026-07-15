import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return

          // React core
          if (/node_modules\/(react|react-dom)\//.test(id)) {
            return "react-vendor"
          }

          // Chakra UI - split into smaller chunks
          if (id.includes("@chakra-ui")) {
            return "chakra-ui"
          }
          if (/node_modules\/(@emotion|framer-motion)\//.test(id)) {
            return "emotion"
          }

          // TanStack libraries
          if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-router")) {
            return "tanstack"
          }

          // Form handling
          if (id.includes("react-hook-form")) {
            return "react-hook-form"
          }

          // DND Kit
          if (id.includes("@dnd-kit")) {
            return "dnd-kit"
          }
        },
      },
    },
    // Increase chunk size warning limit to 600kb (since we're splitting)
    chunkSizeWarningLimit: 600,
  },
})
