import { Box, Avatar, Text, Link, HStack, VStack, Icon } from "@chakra-ui/react"
import { FaHeart, FaRetweet, FaComment } from "react-icons/fa"

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

interface SocialPostCardProps {
  post: SocialPost
}

const SocialPostCard = ({ post }: SocialPostCardProps) => {
  // Strip HTML tags from content (for Mastodon posts)
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  const cleanContent = stripHtml(post.content)
  const truncatedContent = cleanContent.length > 200 
    ? `${cleanContent.substring(0, 200)}...` 
    : cleanContent

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.2s"
      height="300px"
      display="flex"
      flexDirection="column"
    >
      <HStack mb={3} spacing={3}>
        <Avatar 
          size="sm" 
          name={post.author} 
          src={post.author_avatar || undefined}
        />
        <VStack align="start" spacing={0} flex={1}>
          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
            {post.author}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {formatDate(post.created_at)}
          </Text>
        </VStack>
      </HStack>

      <Link href={post.url} isExternal _hover={{ textDecoration: "none" }}>
        <Text 
          fontSize="sm" 
          flex={1} 
          mb={3}
          noOfLines={6}
          lineHeight="1.4"
        >
          {truncatedContent}
        </Text>
      </Link>

      <HStack spacing={4} mt="auto" pt={2} borderTop="1px" borderColor="gray.100">
        <HStack spacing={1}>
          <Icon as={FaHeart} boxSize={3} color="gray.500" />
          <Text fontSize="xs" color="gray.600">{post.likes}</Text>
        </HStack>
        <HStack spacing={1}>
          <Icon as={FaRetweet} boxSize={3} color="gray.500" />
          <Text fontSize="xs" color="gray.600">{post.reposts}</Text>
        </HStack>
        <HStack spacing={1}>
          <Icon as={FaComment} boxSize={3} color="gray.500" />
          <Text fontSize="xs" color="gray.600">{post.replies}</Text>
        </HStack>
      </HStack>
    </Box>
  )
}

export default SocialPostCard
