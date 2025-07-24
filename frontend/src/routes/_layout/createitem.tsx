import React, { useState, useRef } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Box,
  Checkbox,
  Text,
  HStack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { type ItemCreate } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { itemsCreateItem, itemsUpdateItem } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import ImagesUploader, { ImagesUploaderRef } from "../../components/Items/ImagesUploader";
import { createFileRoute } from "@tanstack/react-router";
import { UserPublic } from "../../client";
import { imagesDeleteItemImages, modelsUploadModel, modelsDeleteItemModel, itemsDeleteItem } from "../../client/sdk.gen";

export const Route = createFileRoute("/_layout/createitem")({
  component: CreateItem,
});

function CreateItem() {
  const [isItemStarted, setIsItemStarted] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string>("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const navigate = useNavigate();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const imagesUploaderRef = useRef<ImagesUploaderRef>(null);

  let item: any = {
    id: createdItemId || "",
    owner_id: currentUser?.id || "",
    title: "",
    description: "",
    model: "",
    certificate: "",
    images: "",
    // NFT fields
    is_nft_enabled: true,
    nft_token_id: null,
    nft_contract_address: null,
    nft_transaction_hash: null,
    nft_metadata_uri: null,
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting},
  } = useForm<any>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: item,
  });

  const createMutation = useMutation({
    mutationFn: (data: ItemCreate) => itemsCreateItem({ requestBody: data }),
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { itemId: string; body: ItemCreate }) =>
      itemsUpdateItem({ id: data.itemId, requestBody: data.body }),
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const handleImagesChange = (commaSeparatedUrls: string) => {
    setValue("images", commaSeparatedUrls, { shouldDirty: true });
  };

  const handleCancel = async () => {
    // Delete the initialized item and its files if item was created
    if (createdItemId) {
      try {
        // Delete uploaded files first
        await imagesDeleteItemImages({ itemId: createdItemId });
        await modelsDeleteItemModel({ itemId: createdItemId });
        
        // Delete the item record from database
        await itemsDeleteItem({ id: createdItemId });
        
        showToast("Success", "Item and all associated files deleted", "success");
      } catch (error) {
        console.error("Error deleting item during cancel:", error);
        showToast("Warning", "Some cleanup operations may have failed", "error");
        // Continue with reset even if deletion fails
      }
    }
    
    // Reset all form data
    reset();
    // Reset local state
    setModelFile(null);
    setIsItemStarted(false);
    setCreatedItemId("");
    // Reset images uploader
    imagesUploaderRef.current?.reset();
    // Only show reset message if no item was created
    if (!createdItemId) {
      showToast("Info", "Form has been reset", "success");
    }
  };

  const handleModelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.blend')) {
        showToast("Error", "Only .blend files are allowed", "error");
        event.target.value = ""; // Reset the input
        return;
      }
      
      // Check if item is created before uploading
      if (!createdItemId) {
        showToast("Error", "Please create the item first before uploading model", "error");
        event.target.value = "";
        return;
      }
      
      try {
        // Upload the model file to the server
        await modelsUploadModel({
          formData: { file },
          itemId: createdItemId,
          userId: currentUser?.id?.toString() || "0"
        });
        
        setModelFile(file);
        setValue("model", file.name, { shouldDirty: true });
        showToast("Success", "Model file uploaded successfully", "success");
      } catch (error) {
        console.error("Error uploading model:", error);
        showToast("Error", "Failed to upload model file", "error");
        event.target.value = "";
      }
    }
  };

  const onSubmit: SubmitHandler<any> = (formData) => {
    if (!isItemStarted) {
      createMutation.mutate(formData, {
        onSuccess: (newItem) => {
          setCreatedItemId(newItem.id);
          showToast("Success!", "Item created successfully (step 1).", "success");
          setIsItemStarted(true);
        },
      });
    } else {
      if (!createdItemId) {
        showToast("Error", "Cannot update an item without a valid item ID", "error");
        return;
      }

      updateMutation.mutate(
        { itemId: createdItemId, body: formData },
        {
          onSuccess: () => {
            showToast("Success!", "Item updated successfully (step 2).", "success");
            reset();
            setIsItemStarted(false);
            setCreatedItemId("");
            navigate({ to: "/gallery" });
          },
        }
      );
    }
  };

  // Watch the title and all other fields
  const title = watch("title");

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Title Field */}
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel htmlFor="title">Title</FormLabel>
        <Input
          id="title"
          {...register("title", { required: "Title is required." })}
          placeholder="Title"
          type="text"
        />
        {errors.title && <FormErrorMessage>{errors.title.message as string}</FormErrorMessage>}
      </FormControl>

      {/* Description Field */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input id="description" {...register("description")} placeholder="Description" />
      </FormControl>

      {/* Model File Upload */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="model">3D Model File (.blend)</FormLabel>
        <Box>
          <Input
            id="model"
            type="file"
            accept=".blend"
            onChange={handleModelFileChange}
            display="none"
          />
          <Button
            variant="primary"
            onClick={() => document.getElementById('model')?.click()}
            isDisabled={!isItemStarted}
            width="100%"
            justifyContent="flex-start"
            textAlign="left"
            fontWeight="normal"
            color={modelFile ? "white" : "gray.500"}
            bg={modelFile ? undefined : "gray.50"}
            _hover={modelFile ? undefined : { bg: "gray.100" }}
          >
            {modelFile ? modelFile.name : "Select Blender file (.blend)"}
          </Button>
        </Box>
        {modelFile && (
          <Text mt={2} fontSize="sm" color="green.500">
            ✓ File selected: {modelFile.name}
          </Text>
        )}
      </FormControl>

      {/* NFT Settings */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <Checkbox 
          {...register("is_nft_enabled")} 
          defaultChecked={true}
          colorScheme="blue"
        >
          Enable NFT Creation
        </Checkbox>
      </FormControl>

      {/* NFT Contract Address */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="nft_contract_address">NFT Contract Address (Optional)</FormLabel>
        <Input 
          id="nft_contract_address" 
          {...register("nft_contract_address")} 
          placeholder="0x..." 
        />
      </FormControl>

      {/* NFT Metadata URI */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="nft_metadata_uri">Metadata URI (Optional)</FormLabel>
        <Input 
          id="nft_metadata_uri" 
          {...register("nft_metadata_uri")} 
          placeholder="https://..." 
        />
      </FormControl>

      {/* Images Uploader */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel>Images</FormLabel>
        <Box
          opacity={!isItemStarted ? 0.6 : 1}
          pointerEvents={!isItemStarted ? "none" : "auto"}
        >
          <ImagesUploader
            ref={imagesUploaderRef}
            onImagesChange={handleImagesChange}
            _item={{
              id: createdItemId,
              images: "",
              owner_id: currentUser?.id || 0,
            } as any}
          />
        </Box>
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing={4} mt={6}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={!isItemStarted && !title}
          flex={1}
        >
          {isItemStarted ? "Update Item" : "Initialise Item"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          isDisabled={isSubmitting}
          flex={1}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  );
}

export default CreateItem;
