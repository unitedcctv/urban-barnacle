import { Container, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/contact")({
  component: Contact,
})

function Contact() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Contact</Heading>
        <Text>
          Have a question about an item, an order, or becoming a producer?
          We'd love to hear from you.
        </Text>
        <Text>
          Email us at{" "}
          <Link href="mailto:hello@urbanbarnacle.com" color="ui.main">
            hello@urbanbarnacle.com
          </Link>{" "}
          and we'll get back to you as soon as possible.
        </Text>
      </VStack>
    </Container>
  )
}
