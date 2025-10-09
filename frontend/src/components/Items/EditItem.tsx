import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Box,
  HStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Badge,
  Link,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { ItemPublic } from "../../client";
import { type ItemUpdate } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { itemsUpdateItem, modelsUploadModel, modelsDeleteModel } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { UserPublic } from "../../client";

import ImagesUploader from "./ImagesUploader";

const EditItem = ({ 
  item, 
  onSuccess, 
  onDelete, 
  buttonsDisabled 
}: { 
  item: ItemPublic; 
  onSuccess: () => void;
  onDelete?: () => Promise<void>;
  buttonsDisabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const showToast = useCustomToast();
  const { isOpen: isNFTModalOpen, onOpen: onNFTModalOpen, onClose: onNFTModalClose } = useDisclosure();

  // Store original values for comparison
  // Convert image_urls array to comma-separated string for backward compatibility
  const imagesString = item?.image_urls?.join(",") || "";
  const originalValues = {
    title: item?.title || "",
    description: item?.description || "",
    model: item?.model || "",
    images: imagesString,
  };

  const [originalImages, setOriginalImages] = useState<string>("");
  const [currentImages, setCurrentImages] = useState<string>("");
  const [imagesDeleted, setImagesDeleted] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelDeleted, setModelDeleted] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      id: item?.id,
      owner_id: item?.owner_id || currentUser?.id,
      title: item?.title,
      description: item?.description || "",
      model: item?.model || "",
      images: imagesString,
    },
  });

  // Watch form values for changes
  const watchedValues = watch();

  // Initialize images state
  useEffect(() => {
    setOriginalImages(imagesString);
    setCurrentImages(imagesString);
    setImagesDeleted(false);
    
    // Initialize model state
    setCurrentModel(item.model || null);
    setModelFile(null);
    setModelDeleted(false);
  }, [imagesString, item.model]);

  // Check for changes whenever form values, images, or model change
  useEffect(() => {
    const formHasChanges = 
      (watchedValues.title || "") !== originalValues.title ||
      (watchedValues.description || "") !== originalValues.description ||
      (watchedValues.model || "") !== originalValues.model ||
      currentImages !== originalImages ||
      imagesDeleted ||
      modelDeleted ||
      modelFile !== null;
    
    setHasChanges(formHasChanges);
  }, [watchedValues, currentImages, originalImages, imagesDeleted, modelDeleted, modelFile, originalValues]);

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      itemsUpdateItem({ id: item.id, requestBody: { ...data, title: data.title ?? "" } }),
    onSuccess: () => {
      showToast("Success!", "Item updated successfully.", "success");
      reset();
      queryClient.invalidateQueries({ queryKey: ["items"] }); // Ensure item list refreshes
      onSuccess();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const handleImagesChange = (urls: string) => {
    setCurrentImages(urls);
    setValue("images", urls, { shouldDirty: true });
    // Track if images were deleted
    if (urls !== originalImages) {
      setImagesDeleted(originalImages !== "" && urls === "");
    }
  };

  // Model management handlers
  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.blend')) {
        showToast("Error", "Only .blend files are allowed", "error");
        event.target.value = "";
        return;
      }
      
      try {
        // Upload the model file to the server
        await modelsUploadModel({
          formData: { file },
          itemId: item?.id || "",
          userId: currentUser?.id?.toString() || "0"
        });
        
        setModelFile(file);
        setCurrentModel(file.name);
        setModelDeleted(false);
        setValue("model", file.name, { shouldDirty: true });
        showToast("Success", "Model file uploaded successfully", "success");
      } catch (error) {
        console.error("Error uploading model:", error);
        showToast("Error", "Failed to upload model file", "error");
        event.target.value = "";
      }
    }
  };

  const handleModelDelete = async () => {
    if (!item?.id || !currentModel) return;
    
    try {
      await modelsDeleteModel({
        itemId: item.id,
        userId: currentUser?.id?.toString() || "0",
        fileName: currentModel
      });
      
      setCurrentModel(null);
      setModelFile(null);
      setModelDeleted(true);
      setValue("model", "", { shouldDirty: true });
      showToast("Success", "Model file deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting model:", error);
      showToast("Error", "Failed to delete model file", "error");
    }
  };

  const onSubmit: SubmitHandler<ItemUpdate> = (data) => {
    const updatedData = {
      ...data,
      title: data.title ?? "",
    };
    mutation.mutate(updatedData);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Title Field */}
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel htmlFor="title">Title</FormLabel>
        <Input
          id="title"
          {...register("title", {
            required: "Title is required.",
          })}
          placeholder="Title"
          type="text"
        />
        {errors.title && <FormErrorMessage>{errors.title.message}</FormErrorMessage>}
      </FormControl>

      <FormControl mt={4}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input id="description" {...register("description")} placeholder="Description" />
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Model (.blend file)</FormLabel>
        {currentModel && !modelDeleted ? (
          <Box>
            <HStack spacing={4} align="center">
              <Text fontSize="sm" color="green.500">
                ✓ {currentModel}
              </Text>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={handleModelDelete}
              >
                Delete
              </Button>
            </HStack>
          </Box>
        ) : (
          <Box>
            <Input
              type="file"
              accept=".blend"
              onChange={handleModelUpload}
              display="none"
              id="model-upload"
            />
            <Button
              variant="primary"
              onClick={() => document.getElementById('model-upload')?.click()}
              width="100%"
              justifyContent="flex-start"
              textAlign="left"
              fontWeight="normal"
            >
              Select .blend file
            </Button>
          </Box>
        )}
      </FormControl>

      {/* NFT Information */}
      <FormControl mt={4}>
        <FormLabel>NFT Information</FormLabel>
        {item?.nft_token_id ? (
          <Button
            variant="primary"
            onClick={onNFTModalOpen}
            width="100%"
            justifyContent="flex-start"
            textAlign="left"
            fontWeight="normal"
          >
            Show NFT Details (Token #{item.nft_token_id})
          </Button>
        ) : (
          <Text fontSize="sm" color="gray.500">
            No NFT associated with this item
          </Text>
        )}
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Images</FormLabel>
        <ImagesUploader onImagesChange={handleImagesChange} _item={item ?? {}} />
      </FormControl>

      <HStack spacing={4} mt={4}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={!hasChanges || buttonsDisabled}
        >
          Update Item
        </Button>
        {onDelete && (
          <Button
            colorScheme="red"
            onClick={onDelete}
            isDisabled={buttonsDisabled}
          >
            Delete Item
          </Button>
        )}
      </HStack>

      {/* NFT Details Modal */}
      <Modal isOpen={isNFTModalOpen} onClose={onNFTModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>NFT Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {item?.nft_token_id && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Token Information</Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text>Token ID:</Text>
                      <Badge colorScheme="blue">#{item.nft_token_id}</Badge>
                    </HStack>
                    {item.nft_contract_address && (
                      <HStack justify="space-between">
                        <Text>Contract Address:</Text>
                        <Link 
                          href={`https://etherscan.io/address/${item.nft_contract_address}`} 
                          isExternal 
                          color="blue.500"
                          fontSize="sm"
                        >
                          {item.nft_contract_address.slice(0, 10)}...{item.nft_contract_address.slice(-8)}
                        </Link>
                      </HStack>
                    )}
                    {item.nft_transaction_hash && (
                      <HStack justify="space-between">
                        <Text>Transaction Hash:</Text>
                        <Link 
                          href={`https://etherscan.io/tx/${item.nft_transaction_hash}`} 
                          isExternal 
                          color="blue.500"
                          fontSize="sm"
                        >
                          {item.nft_transaction_hash.slice(0, 10)}...{item.nft_transaction_hash.slice(-8)}
                        </Link>
                      </HStack>
                    )}
                    {item.nft_metadata_uri && (
                      <HStack justify="space-between">
                        <Text>Metadata URI:</Text>
                        <Link 
                          href={item.nft_metadata_uri} 
                          isExternal 
                          color="blue.500"
                          fontSize="sm"
                        >
                          View Metadata
                        </Link>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}
              
              <Box>
                <Text fontWeight="bold" mb={2}>Item Information</Text>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text>Title:</Text>
                    <Text>{item?.title}</Text>
                  </HStack>
                  {item?.description && (
                    <HStack justify="space-between">
                      <Text>Description:</Text>
                      <Text>{item.description}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EditItem;
