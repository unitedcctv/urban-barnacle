import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type React from "react"
import { useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { UserPublic } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import { itemsCreateItem, itemsUpdateItem } from "../../client/sdk.gen"
import {
  imagesDeleteItemImages,
  itemsDeleteItem,
  modelsDeleteItemModel,
  modelsUploadModel,
} from "../../client/sdk.gen"
import type { ItemCreate } from "../../client/types.gen"
import ImagesUploader, {
  type ImagesUploaderRef,
} from "../../components/Common/ImagesUploader"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import uploadIcon from "../../theme/assets/icons/upload.svg"

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateItemModal({ isOpen, onClose }: CreateItemModalProps) {
  const [isItemStarted, setIsItemStarted] = useState(false)
  const [createdItemId, setCreatedItemId] = useState<string>("")
  const [modelFile, setModelFile] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const imagesUploaderRef = useRef<ImagesUploaderRef>(null)

  const item: any = {
    id: createdItemId || "",
    owner_id: currentUser?.id || "",
    title: "",
    description: "",
    model: "",
    certificate: "",
    images: "",
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: item,
  })

  const createMutation = useMutation({
    mutationFn: (data: ItemCreate) => itemsCreateItem({ requestBody: data }),
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { itemId: string; body: ItemCreate }) =>
      itemsUpdateItem({ id: data.itemId, requestBody: data.body }),
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const handleImagesChange = (urls: string | string[]) => {
    // Convert array to string if needed (for backward compatibility)
    const commaSeparatedUrls = Array.isArray(urls) ? urls.join(",") : urls
    setValue("images", commaSeparatedUrls, { shouldDirty: true })
  }

  const handleCancel = async () => {
    // Delete the initialized item and its files if item was created
    if (createdItemId) {
      try {
        // Delete uploaded files first
        await imagesDeleteItemImages({ itemId: createdItemId })
        await modelsDeleteItemModel({ itemId: createdItemId })

        // Delete the item record from database
        await itemsDeleteItem({ id: createdItemId })

        showToast("Success", "Item and all associated files deleted", "success")
      } catch (error) {
        console.error("Error deleting item during cancel:", error)
        showToast("Warning", "Some cleanup operations may have failed", "error")
      }
    }

    // Reset all form data
    reset()
    setModelFile(null)
    setIsItemStarted(false)
    setCreatedItemId("")
    imagesUploaderRef.current?.reset()
    
    // Close the modal
    onClose()
  }

  const handleModalClose = async () => {
    // If an item is being edited, clean up
    if (createdItemId) {
      await handleCancel()
    } else {
      reset()
      setModelFile(null)
      setIsItemStarted(false)
      onClose()
    }
  }

  const handleModelFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith(".blend")) {
        showToast("Error", "Only .blend files are allowed", "error")
        event.target.value = ""
        return
      }

      // Check if item is created before uploading
      if (!createdItemId) {
        showToast(
          "Error",
          "Please create the item first before uploading model",
          "error",
        )
        event.target.value = ""
        return
      }

      try {
        // Upload the model file to the server
        await modelsUploadModel({
          formData: { file },
          itemId: createdItemId,
          userId: currentUser?.id?.toString() || "0",
        })

        setModelFile(file)
        setValue("model", file.name, { shouldDirty: true })
        showToast("Success", "Model file uploaded successfully", "success")
      } catch (error) {
        console.error("Error uploading model:", error)
        showToast("Error", "Failed to upload model file", "error")
        event.target.value = ""
      }
    }
  }

  const onSubmit: SubmitHandler<any> = async (formData) => {
    if (!isItemStarted) {
      createMutation.mutate(formData, {
        onSuccess: (newItem) => {
          setCreatedItemId(newItem.id)
          showToast("Success!", "Item created successfully.", "success")
          setIsItemStarted(true)
        },
      })
    } else {
      if (!createdItemId) {
        showToast(
          "Error",
          "Cannot update an item without a valid item ID",
          "error",
        )
        return
      }

      updateMutation.mutate(
        { itemId: createdItemId, body: formData },
        {
          onSuccess: () => {
            showToast("Success!", "Item updated successfully.", "success")
            reset()
            setIsItemStarted(false)
            setCreatedItemId("")
            setModelFile(null)
            imagesUploaderRef.current?.reset()
            onClose()
          },
        },
      )
    }
  }

  const title = watch("title")

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Item</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
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
              {errors.title && (
                <FormErrorMessage>
                  {errors.title.message as string}
                </FormErrorMessage>
              )}
            </FormControl>

            {/* Description Field */}
            <FormControl mt={4} isDisabled={!isItemStarted}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Input
                id="description"
                {...register("description")}
                placeholder="Description"
              />
            </FormControl>

            {/* Model File Upload */}
            <FormControl mt={4}>
              <FormLabel htmlFor="model">3D Model File (.blend)</FormLabel>
              <Box
                opacity={!isItemStarted ? 0.6 : 1}
                pointerEvents={!isItemStarted ? "none" : "auto"}
              >
                <Input
                  id="model"
                  type="file"
                  accept=".blend"
                  onChange={handleModelFileChange}
                  display="none"
                />
                <Button
                  variant="primary"
                  onClick={() => document.getElementById("model")?.click()}
                  leftIcon={
                    <Image
                      src={uploadIcon}
                      alt="upload"
                      boxSize="20px"
                      sx={{
                        transition: "filter 0.2s ease",
                        _groupHover: {
                          filter:
                            "brightness(0) saturate(100%) invert(47%) sepia(96%) saturate(1787%) hue-rotate(197deg) brightness(98%) contrast(101%)",
                        },
                      }}
                    />
                  }
                  role="group"
                  size="sm"
                >
                  {modelFile ? modelFile.name : "Upload Blender File (.blend)"}
                </Button>
              </Box>
              {modelFile && (
                <Text mt={2} fontSize="sm" color="green.500">
                  ✓ File selected: {modelFile.name}
                </Text>
              )}
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
                  itemId={createdItemId}
                  imageType="item"
                  entityType="item"
                  onImagesChange={handleImagesChange}
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
                {isItemStarted ? "Update Item" : "Initialize Item"}
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
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default CreateItemModal
