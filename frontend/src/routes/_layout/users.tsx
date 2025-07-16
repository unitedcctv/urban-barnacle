import {
  Container,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { usersReadUsers } from "../../client/sdk.gen.ts"
import { type UserPublic } from "../../client/types.gen.ts"
import AddUser from "../../components/Admin/AddUser.tsx"
import Navbar from "../../components/Common/Navbar.tsx"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"
import { UserRow } from "../../components/UserSettings/User.tsx"

const usersSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/users")({
  component: Users,
  validateSearch: (search) => usersSearchSchema.parse(search),
})

const PER_PAGE = 5

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      usersReadUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  }
}

function UsersTable() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { page } = Route.useSearch() as { page: number }
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (page: number) =>
    // @ts-ignore: Suppress TypeScript error
    navigate({ search: (prev) => ({ ...prev, page }) })

  const {
    data: users,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && users?.data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getUsersQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th width="15%">User Name</Th>
              <Th width="40%">Email</Th>
              <Th width="35%">Permissions</Th>
              <Th width="5%">Status</Th>
              <Th width="5%"></Th>
              <Th width="5%"></Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(4).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {users?.data.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={currentUser?.id}
                />
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      <PaginationFooter
        onChangePage={setPage}
        page={page}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  )
}

function Users() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        User Management
      </Heading>

      <Navbar type={"User"} addModalAs={AddUser} />
      <UsersTable />
    </Container>
  )
}
