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

import { type ApiError, type ItemCreate, ItemsService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"


const AddItem = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    setValue, 
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
    },
  })
  const apiUrl = import.meta.env.VITE_API_URL

  const mutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      ItemsService.createItem({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Item created successfully.", "success")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const onSubmit: SubmitHandler<ItemCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
<>
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

    {/* Images Upload Field */}
    <FormControl mt={4}>
      <FormLabel htmlFor="images">Images</FormLabel>
      <Input
        id="images"
        type="file"
        accept="image/*"
        multiple
        onChange={async (e) => {
          if (e.target.files) {
            const uploadedUrls: string = "";
            for (const file of e.target.files) {
              const formData = new FormData();
              formData.append("file", file);

              try {
                const response = await fetch(
                  `${apiUrl}/api/v1/upload`,
                  {
                    method: "POST",
                    body: formData,
                  }
                );
                if (!response.ok) {
                  throw new Error("Failed to upload image");
                }
                const data = await response.json();
                uploadedUrls.concat(",", data.url); // Assume the response contains the URL of the uploaded image
              } catch (error) {
                console.error("Error uploading image:", error);
              }
            }

            // Save the uploaded image URLs to the form state
            setValue("images", uploadedUrls); // Use your form library's `setValue` method
          }
        }}
      />
    </FormControl>

    {/* Submit Button */}
    <Button variant="primary" type="submit" isLoading={isSubmitting}>
      Save
    </Button>
  </Box>
</>
  )
}

export default AddItem
