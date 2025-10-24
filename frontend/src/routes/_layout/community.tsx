import { Container, Text, Box, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/community")({
  component: Community,
})

function Community() {
  return (
    <Container maxW="full" py={8}>
      <Box textAlign="center">
        <Heading size="lg" mb={4}>
          Community
        </Heading>
        <Text color="gray.600">
          Community content coming soon
        </Text>
      </Box>
    </Container>
  )
}

export default Community
