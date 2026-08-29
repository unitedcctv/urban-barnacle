import {
  Box,
  Container,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import mountImage from "../../theme/assets/BToBExamples/mount.png"
import orangeImage from "../../theme/assets/BToBExamples/orange.png"

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
          prototypes and replacement parts to personalised gifts, we can print it.
        </Text>
        <Text textAlign="justify">
          Send us your model (STL, 3MF or STEP) or simply describe what you
          have in mind, and we'll get back to you with a quote.
        </Text>
        <HStack spacing={6} align="stretch" w="full">
          <Box flex="1" textAlign="center">
            <Image
              src={orangeImage}
              alt="Custom orange 3D print"
              w="full"
              objectFit="cover"
              borderRadius="md"
            />
            <Heading size="md" mt={2}>
              WTF
            </Heading>
            <Text fontSize="sm" mt={1}>
              Whatever you think of, we can print it
            </Text>
          </Box>
          <Box flex="1" textAlign="center">
            <Image
              src={mountImage}
              alt="3D-printed mount prototype"
              w="full"
              objectFit="cover"
              borderRadius="md"
            />
            <Heading size="md" mt={2}>
              Prototype
            </Heading>
            <Text fontSize="sm" mt={1}>
              Your partner for prototype development
            </Text>
          </Box>
        </HStack>
        <Text>
          Get in touch at:{" "}
          <Link
            href="mailto:karl@dlab.io?subject=3D%20print%20request"
            color="ui.main"
          >
            karl@ubdm.io
          </Link>
        </Text>
      </VStack>
    </Container>
  )
}
