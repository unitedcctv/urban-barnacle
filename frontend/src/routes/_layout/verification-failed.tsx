import { Container, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/verification-failed")({
  component: VerificationFailed,
})

function VerificationFailed() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Verification failed</Heading>
        <Text>
          We could not verify this product's digital tag. The tag may be
          damaged, the link may have been copied from a genuine product, or the
          product may not be authentic.
        </Text>
        <Text>
          If you believe this is a mistake, please{" "}
          <Link href="mailto:hello@urbanbarnacle.com" color="ui.main">
            contact us
          </Link>
          .
        </Text>
      </VStack>
    </Container>
  )
}
