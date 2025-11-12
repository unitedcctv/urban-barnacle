import { Box, Container, SkeletonText } from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"
import ItemCard from "../../components/Items/ItemCard.tsx"

export const Route = createFileRoute("/_layout/items")({
  component: Dashboard,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

const itemsSearchSchema = z.object({
  page: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number()
  ),
})

const PER_PAGE = 20

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      itemsReadItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

function Dashboard() {
  return (
    <>
      <Container maxW="full">
        <ItemsTable />
      </Container>
    </>
  )
}
function ItemsTable() {
  const queryClient = useQueryClient()
  const { page } = Route.useSearch() as { page: number }
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    navigate({
      search: { page } as any,
    })

  const {
    data: items,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && items?.data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getItemsQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  return (
    <>
      <Box>
        {isPending ? (
          <Box className="grid-container">
            {new Array(5).fill(null).map((_, index) => (
              <Box key={index} className="grid-item">
                <SkeletonText noOfLines={1} paddingBlock="16px" />
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="grid-container">
            {items?.data.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Box>
        )}
      </Box>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  )
}
