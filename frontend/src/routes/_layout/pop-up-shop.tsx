import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import shopEntranceImage from "../../theme/assets/shop_entrance.png"
import tikiLogo from "../../theme/assets/tiki_logo.svg"

export const Route = createFileRoute("/_layout/pop-up-shop")({
  component: PopUpShop,
})

// Retina (2x, 512px) tiles for a crisper map than the standard 256px tiles
// used on the Find Us page
const MAP_LAT = 52.5271653
const MAP_LON = 13.3970453
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${
  MAP_LON - 0.002
},${MAP_LAT - 0.001},${MAP_LON + 0.002},${
  MAP_LAT + 0.001
}&layer=mapnik&marker=${MAP_LAT},${MAP_LON}`

function PopUpShop() {

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={5} align="center" textAlign="center">
        <Flex align="center" justify="center" gap={4}>
          <Image src={tikiLogo} alt="" aria-hidden h="2rem" w="auto" />
          <Heading size="lg">Pop-up shop Berlin</Heading>
          <Image src={tikiLogo} alt="" aria-hidden h="2rem" w="auto" />
        </Flex>
        <Text maxW="lg">
          Come and take a look at the ubdm pop-up store in Mitte, August Str.
          63
        </Text>
        <Image
          src={shopEntranceImage}
          alt="The entrance of the UBDM pop-up shop in Berlin Mitte"
          w="100%"
          maxW="md"
          objectFit="contain"
        />
        <Box
          as="iframe"
          title="Our location on OpenStreetMap"
          src={MAP_SRC}
          width="80%"
          height="600px"
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
