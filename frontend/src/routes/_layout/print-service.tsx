import { Container, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/print-service")({
  component: PrintService,
})

function PrintService() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">3D Print Service</Heading>
        <Text textAlign="justify">
          Alongside our own collection of unique 3D-printed stools, we also
          offer a custom print service. Have an idea, a sketch or a finished
          3D model? We can turn it into a real object. From one-off
          prototypes and replacement parts to personalised gifts, we print in
          durable, multicolour PETG — suitable for indoors and out.
        </Text>
        <Text textAlign="justify">
          Send us your model (STL, 3MF or STEP) or simply describe what you
          have in mind, and we'll get back to you with a quote including
          print time, material and price.
        </Text>
        <Text>
          Get in touch at:{" "}
          <Link
            href="mailto:karl@ubdm.io?subject=3D%20print%20request"
            color="ui.main"
          >
            karl@ubdm.io
          </Link>
        </Text>
      </VStack>
    </Container>
  )
}
