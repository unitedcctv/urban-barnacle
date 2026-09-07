import { ChakraProvider } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"

import { StrictMode } from "react"
import { client } from "./client/client.gen"
import { CartProvider } from "./context/CartContext"
import theme from "./theme"

client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL,
  throwOnError: true,
})

client.interceptors.request.use((request) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    request.headers.set("Authorization", `Bearer ${token}`)
  }
  return request
})

const queryClient = new QueryClient()

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
)
