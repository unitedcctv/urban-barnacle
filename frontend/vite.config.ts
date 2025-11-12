import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          
          // Chakra UI - split into smaller chunks
          'chakra-ui': ['@chakra-ui/react', '@chakra-ui/icons'],
          'emotion': ['@emotion/react', '@emotion/styled', 'framer-motion'],
          
          // TanStack libraries
          'tanstack': ['@tanstack/react-query', '@tanstack/react-router'],
          
          // Form handling
          'react-hook-form': ['react-hook-form'],
          
          // DND Kit
          'dnd-kit': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    // Increase chunk size warning limit to 600kb (since we're splitting)
    chunkSizeWarningLimit: 600,
  },
})
