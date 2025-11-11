import { Box, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react"
import React from "react"
import type { ProducerPublic } from "../../client"

interface ProducerCardProps {
  producer: ProducerPublic
}

export default function ProducerCard({ producer }: ProducerCardProps) {
  const cardBg = useColorModeValue("ui.white", "ui.dark")
  const subtle = useColorModeValue("gray.600", "gray.300")
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (producer.logo_url) {
      setImageSrc(producer.logo_url)
    }
  }, [producer.logo_url])

  return (
    <Box className="grid-item">
      <Box className="grid-item-image">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={producer.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </Box>
      <Box className="grid-item-content" bg={cardBg}>
        <Stack spacing={2}>
          <Heading size="sm" noOfLines={1}>{producer.name}</Heading>
          {producer.location && (
            <Text fontSize="sm" color={subtle} noOfLines={1}>
              {producer.location}
            </Text>
          )}
          <Text fontSize="xs" color={subtle}>
            Since {new Date(producer.created_at).toLocaleDateString()}
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
