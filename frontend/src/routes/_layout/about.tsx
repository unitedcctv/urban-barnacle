import { Container, Text, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import tikiLogo from "../../theme/assets/tiki_logo.png"

export const Route = createFileRoute("/_layout/about")({
  component: About,
})

function About() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <img
          src={tikiLogo}
          alt="Urban Barnacle tiki logo"
          style={{
            maxWidth: "300px",
            width: "100%",
            height: "auto",
            alignSelf: "center",
          }}
        />
        <Text textAlign="justify">
          We create unique pieces leveraging 3D printings ability to
          create infinite variations. Beginning with a collection of stools. Each piece is a multicolour
          PETG 3D print. No peeling paint solid, robust and built for indoors
          and out. UBDM makes mass bespoke production. Every piece can be customised for you.

        </Text>
      </VStack>
    </Container>
  )
}
