import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Skeleton,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { usersReadUsers, producersReadMyProducer } from "../../client/sdk.gen.ts"
import type { UserPublic } from "../../client/types.gen.ts"
import AddUser from "../../components/Admin/AddUser.tsx"
import Navbar from "../../components/Common/Navbar.tsx"
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx"
import { UserRow } from "../../components/UserSettings/User.tsx"
import EditProducer from "../../components/Producers/EditProducer.tsx"
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

function ProducerSection() {
  const navigate = useNavigate()
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure()
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure()

  const { data: producer, isLoading, error } = useQuery({
    queryKey: ["myProducer"],
    queryFn: () => producersReadMyProducer(),
  })

  if (isLoading) {
    return (
      <Box mt={8}>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="120px" />
      </Box>
    )
  }

  if (error) {
    return (
      <Box mt={8}>
        <Text color="red.500">Error loading producer profile.</Text>
      </Box>
    )
  }

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        Producer Console
      </Heading>
      <VStack spacing={4} align="stretch">
        {producer ? (
          <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
            <Heading size="sm" mb={1}>{producer.name}</Heading>
            {producer.location && <Text color="gray.600">{producer.location}</Text>}
            <Flex gap={3} mt={4}>
              <Button variant="primary" onClick={onEditOpen}>
                Edit Producer Profile
              </Button>
              <Button variant="primary" onClick={onCreateOpen}>
                Create Item
              </Button>
            </Flex>
          </Box>
        ) : (
          <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
            <Text mb={3}>No producer profile found.</Text>
            <Button variant="primary" onClick={() => navigate({ to: "/createproducer" })}>
              Create Producer Profile
            </Button>
          </Box>
        )}
      </VStack>

      {producer && (
        <EditProducer producer={producer} isOpen={isEditOpen} onClose={onEditClose} />
      )}
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
      <ProducerSection />
      <Flex gap={4} wrap="wrap" mt={4}>
        <Button as={Link} to="/logs" variant="primary">
          View Logs
        </Button>
      </Flex>
    </Container>
  )
}

export default SuAdmin
