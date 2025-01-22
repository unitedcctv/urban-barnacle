import * as React from "react";
import {
  Box,
  Button,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Image,
  VStack,
  HStack,
  Link,
  useDisclosure,
} from "@chakra-ui/react";
import { type ItemPublic } from "../../client/index.ts";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import EditItem from "../../components/Items/EditItem.tsx";
import { itemsReadItem, itemsDeleteItem } from "../../client/sdk.gen.ts";
import { useQuery, useMutation } from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast";
import { images_url } from "../../utils";

export const Route = createFileRoute("/_layout/item")({
  component: Item,
});

function Item({ item }: { item: ItemPublic }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const search = useSearch({ from: Route.id });
  const itemId = (search as { id: string }).id;
  const showToast = useCustomToast();

  // Use the item directly if passed in, or fetch below
  let itemData: ItemPublic | undefined = item;

  // Fetch item if itemId exists
  const { data, refetch } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => itemsReadItem({ id: itemId }),
    enabled: !!itemId,
  });
  itemData = data as ItemPublic;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsDeleteItem({ id }),
    onSuccess: () => {
      showToast("Success!", "Item deleted successfully.", "success");
      setButtonsDisabled(true);
    },
    onError: () => {
      showToast("Error!", "Failed to delete item.", "error");
    },
  });

  const [buttonsDisabled, setButtonsDisabled] = React.useState(false);

  const handleDelete = () => {
    if (itemId) {
      deleteMutation.mutate(itemId);
    }
  };

  const handleEditSuccess = () => {
    onClose();
    refetch();
  };

  /**
   * Convert the comma-separated `images` string into an array of full URLs.
   */
  const imagesArray = React.useMemo(() => {
    if (itemData?.images && typeof itemData.images === "string") {
      return itemData.images
        .split(",")
        .map((img) => images_url.concat(img.trim()))
        .filter(Boolean);
    }
    return [];
  }, [itemData]);

  // Carousel state
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // When a thumbnail is clicked, show that image
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Container
      maxW="container.md"
      centerContent
      py={8}
    >
      <VStack spacing={6} w="full">
        {/* Title, Description */}
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          {itemData?.title}
        </Text>
        <Text textAlign="center">{itemData?.description}</Text>

        {/* Link from item.model with text "{itemData.title} model" */}
        {itemData?.model && (
          <Text textAlign="center" color="gray.500">
            <Link href={itemData.model} isExternal>
              {`${itemData?.title} model`}
            </Link>
          </Text>
        )}

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
              {imagesArray.map((image, index) => (
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

        {/* Buttons for Edit / Delete */}
        <HStack spacing={4}>
          <Button
            colorScheme="blue"
            onClick={onOpen}
            isDisabled={buttonsDisabled}
          >
            Edit Item
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            isDisabled={buttonsDisabled}
          >
            Delete Item
          </Button>
        </HStack>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {itemData && <EditItem item={itemData} onSuccess={handleEditSuccess} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
