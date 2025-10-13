import {
  Container,
  Heading,
  Text,
  Box,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/community")({
  component: Community,
})

function Community() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Community
      </Heading>
      <Box mt={8}>
        <Text fontSize="lg">
          Welcome to the Community page. Connect with other users and share your experiences.
        </Text>
      </Box>
    </Container>
  )
}

export default Community
