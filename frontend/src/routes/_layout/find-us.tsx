import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/find-us")({
  component: FindUs,
})

const MAP_LAT = 52.5271653
const MAP_LON = 13.3970453
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${
  MAP_LON - 0.008
},${MAP_LAT - 0.004},${MAP_LON + 0.008},${
  MAP_LAT + 0.004
}&layer=mapnik&marker=${MAP_LAT},${MAP_LON}`

function FindUs() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Find Us</Heading>
        <Box as="address" fontStyle="normal">
          <Text fontWeight="bold">UBDM</Text>
          <Text>Auguststraße 63</Text>
          <Text>10117 Berlin</Text>
          <Text>Germany</Text>
        </Box>
        <Box
          as="iframe"
          title="Our location on OpenStreetMap"
          src={MAP_SRC}
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
