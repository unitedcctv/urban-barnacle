import { Box, Container, Heading, Link, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/contact")({
  component: Contact,
})

const MAP_COORDS = "52.496944,13.440528"

function Contact() {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const mapSrc = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${MAP_COORDS}&zoom=15`
    : `https://www.google.com/maps?q=${MAP_COORDS}&z=15&output=embed`

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Contact</Heading>
        <Text>
          Have a question about an item, an order, or becoming a producer? We'd
          love to hear from you.
        </Text>
        <Text>
          Email us at{" "}
          <Link href="mailto:hello@urbanbarnacle.com" color="ui.main">
            hello@urbanbarnacle.com
          </Link>{" "}
          and we'll get back to you as soon as possible.
        </Text>
        <Box
          as="iframe"
          title="Our location on Google Maps"
          src={mapSrc}
          width="100%"
          height="400px"
          border={0}
          borderRadius="md"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </VStack>
    </Container>
  )
}
