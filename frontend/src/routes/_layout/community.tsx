import {
  Container,
  Heading,
  Text,
  Box,
  HStack,
  Link,
  Icon,
  Flex,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FaLinkedin, FaReddit, FaMastodon, FaCloud } from "react-icons/fa"

export const Route = createFileRoute("/_layout/community")({
  component: Community,
})

function Community() {
  const mastodonUrl = import.meta.env.VITE_MASTODON_URL
  const blueskyUrl = import.meta.env.VITE_BLUESKY_URL
  const redditUrl = import.meta.env.VITE_REDDIT_URL
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Community
      </Heading>
      <Box mt={8}>
        <Text fontSize="lg">
          Welcome to the Community page. Connect with other users and share your experiences.
        </Text>
      </Box>

      {/* Social Media Footer */}
      <Box
        as="footer"
        mt={12}
        py={8}
        borderTop="1px"
        borderColor="gray.200"
      >
        <Flex
          direction="column"
          align="center"
          gap={4}
        >
          <Text fontSize="md" fontWeight="semibold">
            Connect with us
          </Text>
          <HStack spacing={6}>
            {mastodonUrl && (
              <Link
                href={mastodonUrl}
                isExternal
                aria-label="Mastodon"
                _hover={{ color: "blue.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Icon as={FaMastodon} boxSize={8} />
              </Link>
            )}
            {blueskyUrl && (
              <Link
                href={blueskyUrl}
                isExternal
                aria-label="Bluesky"
                _hover={{ color: "blue.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Icon as={FaCloud} boxSize={8} />
              </Link>
            )}
            {redditUrl && (
              <Link
                href={redditUrl}
                isExternal
                aria-label="Reddit"
                _hover={{ color: "orange.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Icon as={FaReddit} boxSize={8} />
              </Link>
            )}
            {linkedinUrl && (
              <Link
                href={linkedinUrl}
                isExternal
                aria-label="LinkedIn"
                _hover={{ color: "blue.600", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Icon as={FaLinkedin} boxSize={8} />
              </Link>
            )}
          </HStack>
        </Flex>
      </Box>
    </Container>
  )
}

export default Community
