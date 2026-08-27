import {
  Box,
  Container,
  Heading,
  Icon,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FaCloud, FaLinkedin, FaMastodon, FaReddit } from "react-icons/fa"

export const Route = createFileRoute("/_layout/contact")({
  component: Contact,
})

const MAP_LAT = 52.496944
const MAP_LON = 13.440528
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_LON - 0.008},${MAP_LAT - 0.004},${MAP_LON + 0.008},${MAP_LAT + 0.004}&layer=mapnik&marker=${MAP_LAT},${MAP_LON}`

function Contact() {

  const socialLinks = [
    {
      name: "Mastodon",
      url: import.meta.env.VITE_MASTODON_URL,
      icon: FaMastodon,
      color: "#6364FF",
    },
    {
      name: "Bluesky",
      url: import.meta.env.VITE_BLUESKY_URL,
      icon: FaCloud,
      color: "#1185FE",
    },
    {
      name: "Reddit",
      url: import.meta.env.VITE_REDDIT_URL,
      icon: FaReddit,
      color: "#FF4500",
    },
    {
      name: "LinkedIn",
      url: import.meta.env.VITE_LINKEDIN_URL,
      icon: FaLinkedin,
      color: "#0A66C2",
    },
  ].filter((l) => l.url)

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Contact</Heading>
        <Text>
          Want to get in contact
        </Text>
        <Text>
          Email us at:{" "}
          <Link href="mailto:karl@ubdm.io" color="ui.main">
            karl@ubdm.io
          </Link>{" "}
          and we'll get back to you as soon as possible.
        </Text>
        <Box as="address" fontStyle="normal">
          <Text fontWeight="bold">UBDM</Text>
          <Text>Falckensteinstraße 22</Text>
          <Text>10997 Berlin</Text>
          <Text>Germany</Text>
        </Box>
        {socialLinks.length > 0 && (
          <Box>
            <Heading size="md" mb={3}>
              Follow us
            </Heading>
            <VStack spacing={2} align="flex-start">
              {socialLinks.map(({ name, url, icon, color }) => (
                <Link key={url} href={url} isExternal color="ui.main">
                  <Icon as={icon} color={color} mr={2} />
                  {name}
                </Link>
              ))}
            </VStack>
          </Box>
        )}
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
