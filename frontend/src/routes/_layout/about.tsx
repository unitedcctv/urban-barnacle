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
          Urban Barnacle is a gallery of parametric 3D designs created by
          independent producers. Each item in the gallery is generated from a
          Grasshopper model, so every piece can be customised and manufactured
          on demand.
        </Text>
        <Text>
          Producers upload their parametric models and images, and buyers can
          browse the gallery, view each design in detail, and order directly
          through the platform.
        </Text>
        <Text>
          Our goal is to connect digital designers with people looking for
          unique, made-to-order objects.
        </Text>
      </VStack>
    </Container>
  )
}
