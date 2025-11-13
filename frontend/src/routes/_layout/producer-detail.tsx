import {
  Box,
  Container,
  HStack,
  Image,
  Text,
  VStack,
  Heading,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useSearch } from "@tanstack/react-router"
import * as React from "react"
import type { ProducerPublic } from "../../client/index.ts"
import {
  imagesGetProducerImages,
  producersReadProducer,
} from "../../client/sdk.gen.ts"

export const Route = createFileRoute("/_layout/producer-detail")({
  component: ProducerDetail,
})

function ProducerDetail() {
  const search = useSearch({ from: Route.id })
  const producerId = (search as { id: string }).id
  const cardBg = useColorModeValue("ui.white", "ui.dark")
  const subtle = useColorModeValue("gray.600", "gray.400")

  // Fetch producer data
  const { data: producerData, isLoading } = useQuery({
    queryKey: ["producer", producerId],
    queryFn: () => producersReadProducer({ id: producerId }),
    enabled: !!producerId,
  })

  // Fetch portfolio images
  const { data: portfolioImages = [] } = useQuery({
    queryKey: ["producerImages", producerId, "portfolio"],
    queryFn: async () => {
      const images = await imagesGetProducerImages({
        producerId: producerId,
        imageType: "portfolio",
      })
      return images || []
    },
    enabled: !!producerId,
  })

  // Fetch logo image
  const { data: logoImages = [] } = useQuery({
    queryKey: ["producerImages", producerId, "logo"],
    queryFn: async () => {
      const images = await imagesGetProducerImages({
        producerId: producerId,
        imageType: "logo",
      })
      return images || []
    },
    enabled: !!producerId,
  })

  // Get producer object
  const producer = producerData as ProducerPublic

  // Get portfolio image URLs
  const portfolioImageUrls = React.useMemo(() => {
    return portfolioImages.map((img: any) => img.path)
  }, [portfolioImages])

  // Get logo URL
  const logoUrl = React.useMemo(() => {
    return logoImages.length > 0 ? logoImages[0].path : null
  }, [logoImages])

  // Carousel state
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // When a thumbnail is clicked, show that image
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading producer details...</Text>
      </Container>
    )
  }

  if (!producer) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Producer not found.</Text>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} w="full">
        {/* Portfolio Images Carousel */}
        {portfolioImageUrls.length > 0 && (
          <Box w="full">
            <Heading size="lg" mb={4}>
              Portfolio
            </Heading>
            <Box maxW="800px" mx="auto">
              {/* Main Image */}
              <Image
                src={portfolioImageUrls[currentIndex]}
                alt={`Portfolio image ${currentIndex + 1}`}
                w="full"
                h="500px"
                objectFit="cover"
                borderRadius="md"
                mb={4}
              />

              {/* Thumbnails */}
              {portfolioImageUrls.length > 1 && (
                <HStack justify="center" spacing={2} flexWrap="wrap">
                  {portfolioImageUrls.map((imageUrl: string, index: number) => (
                    <Image
                      key={index}
                      src={imageUrl}
                      alt={`Thumbnail ${index + 1}`}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                      cursor="pointer"
                      borderWidth={index === currentIndex ? "3px" : "1px"}
                      borderColor={
                        index === currentIndex ? "blue.400" : "gray.300"
                      }
                      onClick={() => handleThumbnailClick(index)}
                      _hover={{ borderColor: "blue.300" }}
                    />
                  ))}
                </HStack>
              )}
            </Box>
          </Box>
        )}

        {/* Producer Information */}
        <Box w="full" bg={cardBg} p={8} borderRadius="lg" shadow="md">
          <VStack spacing={6} align="stretch">
            {/* Logo and Name Section */}
            <HStack spacing={6} align="center">
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={`${producer.name} logo`}
                  boxSize="120px"
                  objectFit="contain"
                  borderRadius="md"
                />
              )}
              <VStack align="start" spacing={2}>
                <Heading size="xl">{producer.name}</Heading>
                {producer.location && (
                  <Text fontSize="lg" color={subtle}>
                    📍 {producer.location}
                  </Text>
                )}
              </VStack>
            </HStack>

            {/* Additional Information */}
            <Stack spacing={3} pt={4} borderTopWidth="1px">
              <HStack>
                <Text fontWeight="semibold" minW="100px">
                  Since:
                </Text>
                <Text color={subtle}>
                  {new Date(producer.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </HStack>
            </Stack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}
