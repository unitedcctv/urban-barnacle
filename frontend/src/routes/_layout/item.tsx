import {
  Box,
  Button,
  Container,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
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
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/item")({
  component: Item,
})

function Item({ item: propItem }: { item: ItemPublic }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const search = useSearch({ from: Route.id })
  const itemId = (search as { id: string }).id
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()

  // Use the item directly if passed in, or fetch below
  let itemData: any = propItem

  // Fetch item if itemId exists
  const { data, refetch } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => itemsReadItem({ id: itemId }),
    enabled: !!itemId,
  })
  itemData = data

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsDeleteItem({ id }),
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
        await imagesDeleteItemImages({ itemId })
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

  // Handle purchase model functionality
  const handlePurchaseModel = async () => {
    if (!currentItem?.id) {
      showToast("Error", "Item not found", "error")
      return
    }

    try {
      // Call the backend to create a Stripe checkout session
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            item_id: currentItem.id,
            success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/payment/cancel`,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to create checkout session")
      }

      const data = await response.json()

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error) {
      console.error("Payment error:", error)
      showToast(
        "Payment Error",
        error instanceof Error ? error.message : "Failed to initiate payment",
        "error",
      )
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

  return (
    <Container maxW="container.md" centerContent py={8}>
      <VStack spacing={6} w="full">
        {/* Title, Description */}
        <Text fontSize="2xl" textAlign="center">
          {currentItem?.title}
        </Text>
        <Text textAlign="center">{currentItem?.description}</Text>

        {/* Main Image */}
        {imagesArray.length > 0 && (
          <Box w="full" maxW="400px">
            <Image
              src={imagesArray[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              boxSize="400px"
              objectFit="cover"
              borderRadius="md"
              mx="auto"
              mb={4}
            />

            {/* Thumbnails */}
            <HStack justify="center" spacing={2}>
              {imagesArray.map((image: string, index: number) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  boxSize="60px"
                  objectFit="cover"
                  borderRadius="md"
                  cursor="pointer"
                  borderWidth={index === currentIndex ? "2px" : "1px"}
                  borderColor={index === currentIndex ? "blue.400" : "gray.300"}
                  onClick={() => handleThumbnailClick(index)}
                />
              ))}
            </HStack>
          </Box>
        )}

        {/* Purchase Model Button - Only show if item has a model */}
        {currentItem?.model && !canEdit && (
          <Button
            variant="primary"
            onClick={handlePurchaseModel}
            isDisabled={buttonsDisabled}
          >
            Purchase 3D Model - $10.00
          </Button>
        )}

        {/* Button for Edit - Only visible to superusers or item owners */}
        {canEdit && (
          <Button
            variant="primary"
            onClick={onOpen}
            isDisabled={buttonsDisabled}
          >
            Edit Item
          </Button>
        )}
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
