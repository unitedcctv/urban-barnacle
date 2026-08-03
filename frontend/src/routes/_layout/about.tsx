import { Container, Heading, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/about")({
  component: About,
})

function About() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">About</Heading>
        <Text>
          We create one-of-a-kind furniture leveraging 3D printings ability to create infinite variations. Beginning with a collection of tiki-inspired stools. Why tikis? Why not? Each piece is a multicolour PETG 3D print. No peeling paint solid, robust and built for indoors and out.
          This is mass bespoke production. Every object is designed as an individual unique work. Each piece is linked to a secure, encrypted digital tag that records its identity and provenance, connecting the physical object and its digital record.
          Made to be used, collected and kept.
        </Text>
      </VStack>
    </Container>
  )
}
