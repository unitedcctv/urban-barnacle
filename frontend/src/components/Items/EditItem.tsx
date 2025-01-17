

// This component is used to add a new item. It uses the ImagesUploader component to upload images.
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Box,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { ItemPublic } from "../../client"
import { type ItemCreate } from "../../client/types.gen"
import { type ApiError } from "../../client/core/ApiError"
import { itemsCreateItem } from "../../client/sdk.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

import ImagesUploader from "./ImagesUploader"

const EditItem = ({ item }: { item: ItemPublic }) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate | ItemPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      id: item?.id || "",
      owner_id: item?.owner_id || "",
      title: item?.title || "",
      description: item?.description || "",
      model: item?.model || "",
      certificate: item?.certificate || "",
      images: item?.images || "",
    },
  })

  // React Query mutation for creating the item
  const mutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      itemsCreateItem({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Item created successfully.", "success")
      reset() // resets the form
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  // Called whenever the child (ImagesUploader) updates the image order or uploads
  const handleImagesChange = (commaSeparatedUrls: string) => {
    // Use react-hook-form to set the "images" field
    setValue("images", commaSeparatedUrls)
  }

  const onSubmit: SubmitHandler<ItemCreate> = (data) => {
    mutation.mutate(data)
  }

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
        {errors.title && (
          <FormErrorMessage>{errors.title.message}</FormErrorMessage>
        )}
      </FormControl>

      {/* Description Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input
          id="description"
          {...register("description")}
          placeholder="Description"
          type="text"
        />
      </FormControl>

      {/* Model Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="model">Model</FormLabel>
        <Input
          id="model"
          {...register("model")}
          placeholder="Model"
          type="text"
        />
      </FormControl>

      {/* Certificate Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="certificate">Certificate</FormLabel>
        <Input
          id="certificate"
          {...register("certificate")}
          placeholder="Certificate"
          type="text"
        />
      </FormControl>

      <ImagesUploader
        onImagesChange={handleImagesChange}
        item_id={item?.id ?? ""}
        owner_id={item?.owner_id ?? ""}
      />

      {/* Submit Button */}
      <Button variant="primary" type="submit" isLoading={isSubmitting} mt={4}>
        Save
      </Button>
    </Box>
  )
}

export default EditItem
