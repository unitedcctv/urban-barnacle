import {
  Container,
} from "@chakra-ui/react"

import { createFileRoute } from "@tanstack/react-router"
import AddItem from "../../components/Items/AddItem"

export const Route = createFileRoute("/_layout/items")({
  component: Items,
})

function Items() {
  return (
    <Container maxW="full">
      <AddItem />
    </Container>
  )
}
