import {
    Container,
  } from "@chakra-ui/react"
  import { type ItemPublic } from "../../client"
  import { createFileRoute, useSearch} from "@tanstack/react-router"
  import EditItem from "../../components/Items/EditItem"
  import { itemsReadItem } from "../../client/sdk.gen.ts"
  import { useQuery } from "@tanstack/react-query"
  
  export const Route = createFileRoute("/_layout/edititems")({
    component: EditItems,
  })
  
  function EditItems({ item }: { item: ItemPublic }) {
    const search = useSearch({ from: Route.id })
    const itemId = (search as { id: string }).id
    

    if (itemId !== undefined) {
      const { data } = useQuery({
        queryKey: ['item', itemId],
        queryFn: () => itemsReadItem({ id: itemId }),
      });
      item = data as ItemPublic;
    }

    return (
      <Container maxW="full">
        <EditItem item={item} />
      </Container>
    )
  }