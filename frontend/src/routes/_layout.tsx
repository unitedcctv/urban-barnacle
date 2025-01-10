import { Flex, Box } from "@chakra-ui/react"
import { Outlet, createFileRoute} from "@tanstack/react-router"

import Sidebar from "../components/Common/Sidebar"

export const Route = createFileRoute("/_layout")({
  component: Layout,
})

function Layout() {
  return (
    <Flex direction="column" h="100vh" w="100%">
      <Sidebar />
      <Box as="main" flex="1" w="100%" p={4}>
        <Outlet />
      </Box>
    </Flex>
  )
}
