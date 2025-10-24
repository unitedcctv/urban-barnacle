import { Box, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react"
import type { ProducerPublic } from "../../client"

interface ProducerCardProps {
  producer: ProducerPublic
}

export default function ProducerCard({ producer }: ProducerCardProps) {
  const cardBg = useColorModeValue("ui.white", "ui.dark")
  const border = useColorModeValue("ui.border", "ui.darkSlate")
  const subtle = useColorModeValue("gray.600", "gray.300")

  return (
    <Box
      className="grid-item"
      borderWidth="1px"
      borderColor={border}
      borderRadius="md"
      bg={cardBg}
      p={4}
    >
      <Stack spacing={2}>
        <Heading size="sm">{producer.name}</Heading>
        {producer.location && (
          <Text fontSize="sm" color={subtle}>
            {producer.location}
          </Text>
        )}
        <Text fontSize="xs" color={subtle}>
          Since {new Date(producer.created_at).toLocaleDateString()}
        </Text>
      </Stack>
    </Box>
  )
}
