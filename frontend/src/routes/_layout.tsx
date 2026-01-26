import { Box, Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router"

import Navigation from "../components/Common/Navigation"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isHome = pathname === "/"

  return (
    <Flex direction="column" h="100vh" w="100%">
      <Navigation />
      <Box
        as="main"
        flex="1"
        w="100%"
        pt={{ base: 0, sm: isHome ? 0 : "62px" }}
      >
        <Outlet />
      </Box>
    </Flex>
  )
}
