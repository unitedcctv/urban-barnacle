import {
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useSearch } from "@tanstack/react-router"
import { useNavigate } from "@tanstack/react-router"
import * as React from "react"
import type { ItemPublic } from "../../client/index.ts"
import {
  imagesDeleteItemImages,
  itemsDeleteItem,
  itemsReadItem,
} from "../../client/sdk.gen.ts"
import EditItem from "../../components/Items/EditItem.tsx"
import { useCart } from "../../context/CartContext"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/item")({
  component: Item,
})

function Item({ item: propItem }: { item: ItemPublic }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const search = useSearch({ from: Route.id })
  const itemId = (search as { id: string }).id
  const { verified, tap } = search as { verified?: string; tap?: string }
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const { addItem, hasItem } = useCart()

  // Use the item directly if passed in, or fetch below
  let itemData: any = propItem

  // Fetch item if itemId exists
  const { data, refetch } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () =>
      itemsReadItem({ path: { id: itemId }, throwOnError: true }),
    enabled: !!itemId,
  })
  itemData = data

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      itemsDeleteItem({ path: { id }, throwOnError: true }),
    onSuccess: () => {
      showToast("Success!", "Item deleted successfully.", "success")
      setButtonsDisabled(true)
    },
    onError: () => {
      showToast("Error!", "Failed to delete item.", "error")
    },
  })

  const [buttonsDisabled, setButtonsDisabled] = React.useState(false)

  const handleDelete = async () => {
    if (itemId) {
      try {
        // Attempt to delete the item images first
        await imagesDeleteItemImages({
          path: { item_id: itemId },
          throwOnError: true,
        })
      } catch (error) {
        console.error(`Error deleting images for item ${itemId}:`, error)
        showToast(
          "Error!",
          `Failed to delete images for item ${itemId}.`,
          "error",
        )
      } finally {
        // Always attempt to delete the item
        deleteMutation.mutate(itemId, {
          onSuccess: () => {
            // Invalidate the items query to refetch the items list
            queryClient.invalidateQueries({ queryKey: ["items"] })
            navigate({ to: "/items" })
          },
        })
      }
    } else {
      showToast("Error!", "Failed to delete item.", "error")
    }
  }

  const handleAddToCart = () => {
    if (!currentItem?.id) return
    const added = addItem({
      id: currentItem.id,
      title: currentItem.title,
      price: currentItem.price ?? 0,
      image_url: imagesArray[0] ?? null,
    })
    if (added) {
      showToast("Added", `${currentItem.title} added to your cart.`, "success")
    } else {
      showToast("Cart", "This item is already in your cart.", "success")
    }
  }

  const handleEditSuccess = () => {
    onClose()
    refetch()
  }

  /**
   * Get image URLs from the image_urls array.
   */
  const imagesArray = React.useMemo(() => {
    const currentItem = itemData?.item || itemData
    if (currentItem?.image_urls && Array.isArray(currentItem.image_urls)) {
      return currentItem.image_urls
    }
    return []
  }, [itemData])

  // Carousel state
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // When a thumbnail is clicked, show that image
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  // Get edit permission from server
  const canEdit = itemData?.can_edit || false

  // Get the actual item data
  const currentItem = itemData?.item || itemData

  // Color mode values
  const cardBg = useColorModeValue("ui.white", "ui.dark")
  const subtle = useColorModeValue("gray.600", "gray.400")

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} w="full">
        {/* Item Images Carousel */}
        {imagesArray.length > 0 && (
          <Box w="full">
            <Box maxW="800px" mx="auto">
              {/* Main Image */}
              <Image
                src={imagesArray[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                w="full"
                h="500px"
                objectFit="cover"
                borderRadius="md"
                mb={4}
              />

              {/* Thumbnails */}
              {imagesArray.length > 1 && (
                <HStack justify="center" spacing={2} flexWrap="wrap">
                  {imagesArray.map((image: string, index: number) => (
                    <Image
                      key={index}
                      src={image}
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

        {/* Item Information */}
        <Box w="full" bg={cardBg} p={8} borderRadius="lg" shadow="md">
          <VStack spacing={6} align="stretch">
            {/* Title and Description Section */}
            <VStack align="start" spacing={4}>
              <Heading size="xl">{currentItem?.title}</Heading>
              {verified === "true" && (
                <HStack spacing={3}>
                  <Badge
                    colorScheme="green"
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    Verified authentic
                  </Badge>
                  {tap && (
                    <Text fontSize="sm" color={subtle}>
                      NFC tag verification #{tap}
                    </Text>
                  )}
                </HStack>
              )}
              {currentItem?.description && (
                <Text fontSize="md" color={subtle}>
                  {currentItem.description}
                </Text>
              )}
              <HStack spacing={3} align="center">
                {(currentItem?.price ?? 0) > 0 && (
                  <Text fontSize="xl" fontWeight="bold">
                    €{currentItem.price.toFixed(2)}
                  </Text>
                )}
                {currentItem?.is_sold && (
                  <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
                    Sold
                  </Badge>
                )}
              </HStack>
            </VStack>

            {/* Actions Section */}
            <Stack spacing={3} pt={4} borderTopWidth="1px">
              <HStack spacing={4} flexWrap="wrap">
                {/* Add to Cart - visible to buyers when item has a price and isn't sold */}
                {!canEdit && (currentItem?.price ?? 0) > 0 && !currentItem?.is_sold && (
                  hasItem(currentItem.id) ? (
                    <Button
                      variant="primary"
                      onClick={() => navigate({ to: "/cart" })}
                      size="lg"
                    >
                      In Cart - Go to Checkout
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleAddToCart}
                      isDisabled={buttonsDisabled}
                      size="lg"
                    >
                      Add to Cart - €{currentItem.price.toFixed(2)}
                    </Button>
                  )
                )}

                {/* Button for Edit - Only visible to superusers or item owners */}
                {canEdit && (
                  <Button
                    variant="primary"
                    onClick={onOpen}
                    isDisabled={buttonsDisabled}
                    size="lg"
                  >
                    Edit Item
                  </Button>
                )}
              </HStack>
            </Stack>
          </VStack>
        </Box>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentItem && (
              <EditItem
                item={currentItem}
                onSuccess={handleEditSuccess}
                onDelete={handleDelete}
                buttonsDisabled={buttonsDisabled}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
