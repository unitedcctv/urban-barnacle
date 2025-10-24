import { Container, Text, Box, Heading, HStack, Link, Icon } from "@chakra-ui/react"
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
    <Container maxW="full" py={8}>
      <Box textAlign="center">
        <Heading size="lg" mb={4}>
          Community
        </Heading>
        <Text color="gray.600" mb={8}>
          Connect with us on social media
        </Text>
        
        <HStack spacing={6} justify="center" wrap="wrap">
          {mastodonUrl && (
            <Link href={mastodonUrl} isExternal>
              <Box
                p={4}
                bg="#6364FF"
                color="white"
                borderRadius="lg"
                _hover={{ transform: "scale(1.1)", opacity: 0.9 }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FaMastodon} boxSize={6} />
                <Text fontWeight="bold">Mastodon</Text>
              </Box>
            </Link>
          )}
          
          {blueskyUrl && (
            <Link href={blueskyUrl} isExternal>
              <Box
                p={4}
                bg="#1185FE"
                color="white"
                borderRadius="lg"
                _hover={{ transform: "scale(1.1)", opacity: 0.9 }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FaCloud} boxSize={6} />
                <Text fontWeight="bold">Bluesky</Text>
              </Box>
            </Link>
          )}
          
          {redditUrl && (
            <Link href={redditUrl} isExternal>
              <Box
                p={4}
                bg="#FF4500"
                color="white"
                borderRadius="lg"
                _hover={{ transform: "scale(1.1)", opacity: 0.9 }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FaReddit} boxSize={6} />
                <Text fontWeight="bold">Reddit</Text>
              </Box>
            </Link>
          )}
          
          {linkedinUrl && (
            <Link href={linkedinUrl} isExternal>
              <Box
                p={4}
                bg="#0A66C2"
                color="white"
                borderRadius="lg"
                _hover={{ transform: "scale(1.1)", opacity: 0.9 }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={FaLinkedin} boxSize={6} />
                <Text fontWeight="bold">LinkedIn</Text>
              </Box>
            </Link>
          )}
        </HStack>
      </Box>
    </Container>
  )
}

export default Community
