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

export const Route = createFileRoute("/_layout/producerconsole")({
  component: ProducerConsole,
})

function ProducerConsole() {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()

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
    <Box>
      <Heading size="lg" mb={6}>
        Producer Console
      </Heading>

      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>
            {producer.name}
          </Heading>
          {producer.location && (
            <Text color="gray.600">{producer.location}</Text>
          )}
        </Box>

        <Button variant="primary" onClick={onOpen} maxW="300px">
          Edit Producer Profile
        </Button>

        {/* Additional console features can be added here */}
      </VStack>

      {/* Edit Producer Modal */}
      {producer && (
        <EditProducer
          producer={producer}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </Box>
  )
}

export default ProducerConsole
