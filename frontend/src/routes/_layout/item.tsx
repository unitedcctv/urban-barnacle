import * as React from "react";
import {
  Container,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { type ItemPublic } from "../../client/index.ts";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import EditItem from "../../components/Items/EditItem.tsx";
import { itemsReadItem, itemsDeleteItem } from "../../client/sdk.gen.ts";
import { useQuery, useMutation } from "@tanstack/react-query";
import useCustomToast from "../../hooks/useCustomToast";

export const Route = createFileRoute("/_layout/item")({
  component: Item,
});

function Item({ item }: { item: ItemPublic }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const search = useSearch({ from: Route.id });
  const itemId = (search as { id: string }).id;
  const showToast = useCustomToast();

  let itemData: ItemPublic | undefined = item;

  const { data, refetch } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => itemsReadItem({ id: itemId }),
    enabled: !!itemId, // Only fetch if itemId is defined
  });
  itemData = data as ItemPublic;

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
    onClose(); // Close the modal
    refetch(); // Refresh item data
  };

  return (
    <Container maxW="full">
      <Button
        colorScheme="blue"
        onClick={onOpen}
        mr={4}
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
