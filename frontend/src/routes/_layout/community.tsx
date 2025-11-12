import {
  Box,
  Container,
  HStack,
  Heading,
  Icon,
  Link,
  Text,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import {
  FaCloud,
  FaLinkedin,
  FaMastodon,
  FaReddit,
  FaYoutube,
} from "react-icons/fa"

export const Route = createFileRoute("/_layout/community")({
  component: Community,
})

function Community() {
  const mastodonUrl = import.meta.env.VITE_MASTODON_URL
  const blueskyUrl = import.meta.env.VITE_BLUESKY_URL
  const redditUrl = import.meta.env.VITE_REDDIT_URL
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL
  const youtubeUrl = import.meta.env.VITE_YOUTUBE_URL

  return (
    <Container maxW="full" py={8}>
      <Box textAlign="center">
        <Heading size="md" mb={4}>
          Community
        </Heading>
        <Text color="gray.600" mb={8}>
          Connect with us on social media
        </Text>

        <HStack spacing={6} justify="center" wrap="wrap">
          {mastodonUrl && (
            <Link href={mastodonUrl} isExternal>
              <Box
                width="200px"
                height="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="10px solid"
                borderColor="gray.300"
                borderRadius="md"
                _hover={{ borderColor: "gray.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                <Icon as={FaMastodon} boxSize="60px" color="#6364FF" />
              </Box>
            </Link>
          )}

          {blueskyUrl && (
            <Link href={blueskyUrl} isExternal>
              <Box
                width="200px"
                height="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="10px solid"
                borderColor="gray.300"
                borderRadius="md"
                _hover={{ borderColor: "gray.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                <Icon as={FaCloud} boxSize="60px" color="#1185FE" />
              </Box>
            </Link>
          )}

          {redditUrl && (
            <Link href={redditUrl} isExternal>
              <Box
                width="200px"
                height="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="10px solid"
                borderColor="gray.300"
                borderRadius="md"
                _hover={{ borderColor: "gray.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                <Icon as={FaReddit} boxSize="60px" color="#FF4500" />
              </Box>
            </Link>
          )}

          {linkedinUrl && (
            <Link href={linkedinUrl} isExternal>
              <Box
                width="200px"
                height="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="10px solid"
                borderColor="gray.300"
                borderRadius="md"
                _hover={{ borderColor: "gray.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                <Icon as={FaLinkedin} boxSize="60px" color="#0A66C2" />
              </Box>
            </Link>
          )}

          {youtubeUrl && (
            <Link href={youtubeUrl} isExternal>
              <Box
                width="200px"
                height="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="10px solid"
                borderColor="gray.300"
                borderRadius="md"
                _hover={{ borderColor: "gray.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                <Icon as={FaYoutube} boxSize="60px" color="#FF0000" />
              </Box>
            </Link>
          )}
        </HStack>
      </Box>
    </Container>
  )
}

export default Community
