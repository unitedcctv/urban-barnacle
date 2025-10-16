import {
  Container,
  Text,
  Box,
  HStack,
  Link,
  Icon,
  VStack,
  Grid,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { FaLinkedin, FaReddit, FaMastodon, FaCloud } from "react-icons/fa"
import SocialPostCard from "../../components/Common/SocialPostCard"

export const Route = createFileRoute("/_layout/community")({
  component: Community,
})

interface SocialPost {
  id: number
  platform: string
  post_id: string
  author: string
  author_avatar: string | null
  content: string
  url: string
  created_at: string
  likes: number
  reposts: number
  replies: number
}

interface PlatformData {
  posts: SocialPost[]
  error: string | null
}

interface SocialPostsResponse {
  mastodon: PlatformData
  bluesky: PlatformData
  reddit: PlatformData
  linkedin: PlatformData
  last_updated: string
}

function Community() {
  const mastodonUrl = import.meta.env.VITE_MASTODON_URL
  const blueskyUrl = import.meta.env.VITE_BLUESKY_URL
  const redditUrl = import.meta.env.VITE_REDDIT_URL
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL
  const apiBase = import.meta.env.VITE_API_URL ?? ""

  const { data: socialPosts, isLoading } = useQuery<SocialPostsResponse>({
    queryKey: ["socialPosts"],
    queryFn: async () => {
      const response = await fetch(`${apiBase}/api/v1/social/posts`)
      if (!response.ok) {
        throw new Error("Failed to fetch social posts")
      }
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return (
    <Container maxW="full">
      {/* Social Media Posts */}
      <Box mt={12}>        
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" />
          </Center>
        ) : socialPosts ? (
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gap={6}
            alignItems="start"
          >
            {/* Mastodon Column */}
            <VStack spacing={4} align="stretch">
              {mastodonUrl ? (
                <Link href={mastodonUrl} isExternal _hover={{ textDecoration: "none" }}>
                  <HStack
                    spacing={2}
                    p={3}
                    bg="#6364FF"
                    color="white"
                    borderRadius="md"
                    fontWeight="bold"
                    _hover={{ opacity: 0.9 }}
                  >
                    <Icon as={FaMastodon} boxSize={5} />
                    <Text>Mastodon</Text>
                  </HStack>
                </Link>
              ) : (
                <HStack
                  spacing={2}
                  p={3}
                  bg="#6364FF"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                >
                  <Icon as={FaMastodon} boxSize={5} />
                  <Text>Mastodon</Text>
                </HStack>
              )}
              {socialPosts.mastodon.error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{socialPosts.mastodon.error}</Text>
                </Alert>
              ) : (
                socialPosts.mastodon.posts.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}
            </VStack>

            {/* Bluesky Column */}
            <VStack spacing={4} align="stretch">
              {blueskyUrl ? (
                <Link href={blueskyUrl} isExternal _hover={{ textDecoration: "none" }}>
                  <HStack
                    spacing={2}
                    p={3}
                    bg="#1185FE"
                    color="white"
                    borderRadius="md"
                    fontWeight="bold"
                    _hover={{ opacity: 0.9 }}
                  >
                    <Icon as={FaCloud} boxSize={5} />
                    <Text>Bluesky</Text>
                  </HStack>
                </Link>
              ) : (
                <HStack
                  spacing={2}
                  p={3}
                  bg="#1185FE"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                >
                  <Icon as={FaCloud} boxSize={5} />
                  <Text>Bluesky</Text>
                </HStack>
              )}
              {socialPosts.bluesky.error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{socialPosts.bluesky.error}</Text>
                </Alert>
              ) : (
                socialPosts.bluesky.posts.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}
            </VStack>

            {/* Reddit Column */}
            <VStack spacing={4} align="stretch">
              {redditUrl ? (
                <Link href={redditUrl} isExternal _hover={{ textDecoration: "none" }}>
                  <HStack
                    spacing={2}
                    p={3}
                    bg="#FF4500"
                    color="white"
                    borderRadius="md"
                    fontWeight="bold"
                    _hover={{ opacity: 0.9 }}
                  >
                    <Icon as={FaReddit} boxSize={5} />
                    <Text>Reddit</Text>
                  </HStack>
                </Link>
              ) : (
                <HStack
                  spacing={2}
                  p={3}
                  bg="#FF4500"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                >
                  <Icon as={FaReddit} boxSize={5} />
                  <Text>Reddit</Text>
                </HStack>
              )}
              {socialPosts.reddit.error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{socialPosts.reddit.error}</Text>
                </Alert>
              ) : (
                socialPosts.reddit.posts.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}
            </VStack>

            {/* LinkedIn Column */}
            <VStack spacing={4} align="stretch">
              {linkedinUrl ? (
                <Link href={linkedinUrl} isExternal _hover={{ textDecoration: "none" }}>
                  <HStack
                    spacing={2}
                    p={3}
                    bg="#0A66C2"
                    color="white"
                    borderRadius="md"
                    fontWeight="bold"
                    _hover={{ opacity: 0.9 }}
                  >
                    <Icon as={FaLinkedin} boxSize={5} />
                    <Text>LinkedIn</Text>
                  </HStack>
                </Link>
              ) : (
                <HStack
                  spacing={2}
                  p={3}
                  bg="#0A66C2"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                >
                  <Icon as={FaLinkedin} boxSize={5} />
                  <Text>LinkedIn</Text>
                </HStack>
              )}
              {socialPosts.linkedin.error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">{socialPosts.linkedin.error}</Text>
                </Alert>
              ) : (
                socialPosts.linkedin.posts.map((post) => (
                  <SocialPostCard
                    key={post.id}
                    post={post}
                  />
                ))
              )}
            </VStack>
          </Grid>
        ) : null}
      </Box>
    </Container>
  )
}

export default Community
