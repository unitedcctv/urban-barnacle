import {
  Container,
  SkeletonText,
  Box,
  useDisclosure
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"
import { ItemsService } from "../../client"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 20

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ItemsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
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
  const editUserModal = useDisclosure()
  const queryClient = useQueryClient()
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    navigate({ search: (prev: {[key: string]: string}) => ({ ...prev, page }) })

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
                <Box className="grid-item" key={item.id} onClick={editUserModal.onOpen}>
                  {/* <img src={item.image} alt={item.title} /> */}
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="likes">{item.id}</span>
                </Box>
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
