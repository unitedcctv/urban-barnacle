import {
  Box,
  Container,
  Heading,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/impressum")({
  component: Impressum,
})

function Impressum() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Impressum</Heading>

        <Box>
          <Heading size="md" mb={2}>
            Angaben gemäß § 5 DDG
          </Heading>
          <Text>Karl Burton, Einzelunternehmen</Text>
          <Text>handelnd unter UBDM</Text>
          <Text>Fehrbelliner Str. 16</Text>
          <Text>10119 Berlin</Text>
          <Text>Deutschland</Text>
        </Box>

        <Box>
          <Heading size="md" mb={2}>
            Kontakt
          </Heading>
          <RouterLink
            to="/contact"
            search={{ subject: "Impressum" }}
          >
            <Link as="span" color="ui.main">
              Kontaktformular
            </Link>
          </RouterLink>
          <Text>E-Mail: karl@ubdm.io</Text>
        </Box>

        <Box>
          <Heading size="md" mb={2}>
            Verbraucherstreitbeilegung / Universalschlichtungsstelle
          </Heading>
          <Text>
            Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
