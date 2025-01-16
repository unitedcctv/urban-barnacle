import {
    Container,
  } from "@chakra-ui/react"
  import { type ItemPublic } from "../../client"
  import { createFileRoute, useSearch} from "@tanstack/react-router"
  import EditItem from "../../components/Items/EditItem"
  
  export const Route = createFileRoute("/_layout/edititems")({
    component: EditItems,
  })
  
  function EditItems({ item }: { item: ItemPublic }) {
    const search = useSearch({ from: Route.id }) // Specify the route context here
    const itemId = search.id
    return (
      <Container maxW="full">
        <EditItem item={item} />
      </Container>
    )
  }