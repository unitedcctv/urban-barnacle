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
    formState: { errors, isSubmitting },
  } = useForm<ItemCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
    },
  })

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
        <FormControl mt={4}>
          <FormLabel htmlFor="description">Description</FormLabel>
          <Input
            id="description"
            {...register("description")}
            placeholder="Description"
            type="text"
          />
        </FormControl>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          Save
        </Button>
      </Box>
    </>
  )
}

export default AddItem
