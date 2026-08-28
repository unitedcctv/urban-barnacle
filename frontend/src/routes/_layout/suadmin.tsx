import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { usersReadUsers } from "../../client/sdk.gen.ts"
import type { UserPublic } from "../../client/types.gen.ts"
import AddUser from "../../components/Admin/AddUser.tsx"
import NfcTagSection from "../../components/Admin/NfcTagSection.tsx"
import Navbar from "../../components/Common/Navbar.tsx"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"
import { UserRow } from "../../components/UserSettings/User.tsx"
import CreateItemModal from "../../components/Items/CreateItemModal.tsx"

const usersSearchSchema = z.object({
  page: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number()
  ),
})

export const Route = createFileRoute("/_layout/suadmin")({
  component: SuAdmin,
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
    navigate({ search: { page } as any })

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
              <Th width="5%" />
              <Th width="5%" />
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

function ItemsSection() {
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure()

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        Items
      </Heading>
      <Button variant="primary" onClick={onCreateOpen}>
        Create Item
      </Button>
      <CreateItemModal isOpen={isCreateOpen} onClose={onCreateClose} />
    </Box>
  )
}

function SuAdmin() {
  return (
    <Container maxW="full">
      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }}>
        <Navbar type={"User"} addModalAs={AddUser} />
      </Flex>
      <UsersTable />
      <ItemsSection />
      <NfcTagSection />
      <Flex gap={4} wrap="wrap" mt={4}>
        <Button as={Link} to="/logs" variant="primary">
          View Logs
        </Button>
      </Flex>
    </Container>
  )
}

export default SuAdmin
