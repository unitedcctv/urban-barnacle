import {
  Box,
  Button,
  Heading,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { createFileRoute } from "@tanstack/react-router"
import { producersReadMyProducer } from "../../client/sdk.gen"
import EditProducer from "../../components/Producers/EditProducer"
import CreateItemModal from "../../components/Items/CreateItemModal"

export const Route = createFileRoute("/_layout/producerconsole")({
  component: ProducerConsole,
})

function ProducerConsole() {
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

  // Fetch the current user's producer profile
  const {
    data: producer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myProducer"],
    queryFn: () => producersReadMyProducer(),
  })

  // Handle error state
  if (error) {
    return (
      <Box>
        <Text color="red.500">
          Error loading producer profile. Please try again.
        </Text>
        <Button mt={4} onClick={() => navigate({ to: "/producers" })}>
          Go Back
        </Button>
      </Box>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="200px" />
      </Box>
    )
  }

  // If no producer profile exists, redirect to create page
  if (!producer) {
    navigate({ to: "/createproducer" })
    return null
  }

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <Heading size="lg" mb={8}>
        Producer Console
      </Heading>

      <VStack spacing={8} align="stretch">
        {/* Producer Profile Section */}
        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <Heading size="md" mb={2}>
            {producer.name}
          </Heading>
          {producer.location && (
            <Text color="gray.600">
              {producer.location}
            </Text>
          )}
        </Box>

        {/* Actions Section */}
        <Box
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <Heading size="sm" mb={4}>
            Actions
          </Heading>
          <VStack spacing={3} align="stretch">
            <Button variant="primary" onClick={onEditOpen}>
              Edit Producer Profile
            </Button>

            <Button variant="primary" onClick={onCreateOpen}>
              Create Item
            </Button>
          </VStack>
        </Box>
      </VStack>

      {/* Edit Producer Modal */}
      {producer && (
        <EditProducer
          producer={producer}
          isOpen={isEditOpen}
          onClose={onEditClose}
        />
      )}

      {/* Create Item Modal */}
      <CreateItemModal isOpen={isCreateOpen} onClose={onCreateClose} />
    </Box>
  )
}

export default ProducerConsole
