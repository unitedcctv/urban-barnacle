import { Container, HStack, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import tikiLogo from "../../theme/assets/tiki_logo.png"
import ubdmLogo from "../../theme/assets/ubdm.svg"
import popupShop from "../../theme/assets/shop.jpeg"
export const Route = createFileRoute("/_layout/about")({
  component: About,
})

function About() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={100} align="flex-start">
        <VStack spacing={6} align="flex-start">
            <img
            src={ubdmLogo}
            alt="Urban Barnacle logo"
            style={{
              maxWidth: "360px",
              width: "100%",
              height: "auto",
              alignSelf: "center",
            }}
          />
          <Text textAlign="justify">
            We create unique objects using 3D printing. UBDM is mass-bespoke production. We can customise every piece for you.
          </Text>
        </VStack>
        <HStack>
          <img
            src={popupShop}
            alt="popup shop"
            style={{
              maxWidth: "200px",
              width: "100%",
              height: "auto",
              alignSelf: "center",
            }}
          />
          <HStack flex={1} align="flex-start" alignSelf="flex-start">
            <img
              src={tikiLogo}
              alt="Urban Barnacle tiki logo"
              style={{
                maxWidth: "100px",
                width: "100%",
                height: "auto",
                alignSelf: "flex-start",
              }}
            />
            <Text textAlign="justify" fontSize="md">
              <span style={{ fontWeight: "bold" }}>Coming soon ubdm popup store</span> in the heart of Berlin.
              Visit us if you don't find what you want we can probably make it for you.
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Container>
  )
}
