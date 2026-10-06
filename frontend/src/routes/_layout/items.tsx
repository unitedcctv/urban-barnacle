import { Container } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import ItemsGrid from "../../components/Items/ItemsGrid.tsx"

export const Route = createFileRoute("/_layout/items")({
  component: Dashboard,
})

function Dashboard() {
  return (
    <Container maxW="full">
      <ItemsGrid />
    </Container>
  )
}
