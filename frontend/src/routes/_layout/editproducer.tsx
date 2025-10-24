import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { ApiError } from "../../client/core/ApiError"
import {
  producersReadMyProducer,
  producersUpdateProducer,
} from "../../client/sdk.gen"
import type { ProducerUpdate } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

export const Route = createFileRoute("/_layout/editproducer")({
  component: EditProducer,
})

function EditProducer() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const navigate = useNavigate()

  // Fetch the current user's producer profile
  const {
    data: producer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myProducer"],
    queryFn: () => producersReadMyProducer(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProducerUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      location: "",
    },
  })

  // Reset form when producer data is loaded
  useEffect(() => {
    if (producer) {
      reset({
        name: producer.name || "",
        location: producer.location || "",
      })
    }
  }, [producer, reset])

  const mutation = useMutation({
    mutationFn: (data: ProducerUpdate) =>
      producersUpdateProducer({ id: producer!.id, requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Producer profile updated successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      queryClient.invalidateQueries({ queryKey: ["myProducer"] })
      navigate({ to: "/producers" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<ProducerUpdate> = (data) => {
    mutation.mutate(data)
  }

  const handleCancel = () => {
    reset()
    navigate({ to: "/producers" })
  }

  // Handle error state
  if (error) {
    return (
      <Box>
        <Text color="red.500">
          Error loading producer profile. Please try again.
        </Text>
        <Button mt={4} onClick={() => navigate({ to: "/producers" })}>
          Go Back
        </Button>
      </Box>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Skeleton height="40px" mb={4} />
        <Skeleton height="40px" mb={4} />
        <Skeleton height="40px" />
      </Box>
    )
  }

  // If no producer profile exists, redirect to create page
  if (!producer) {
    navigate({ to: "/createproducer" })
    return null
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Name Field */}
      <FormControl isRequired isInvalid={!!errors.name}>
        <FormLabel htmlFor="name">Producer Name</FormLabel>
        <Input
          id="name"
          {...register("name", {
            required: "Producer name is required",
            minLength: {
              value: 1,
              message: "Name must be at least 1 character",
            },
            maxLength: {
              value: 255,
              message: "Name must be at most 255 characters",
            },
          })}
          placeholder="Producer Name"
          type="text"
        />
        {errors.name && (
          <FormErrorMessage>{errors.name.message}</FormErrorMessage>
        )}
      </FormControl>

      {/* Location Field */}
      <FormControl mt={4} isInvalid={!!errors.location}>
        <FormLabel htmlFor="location">Location</FormLabel>
        <Input
          id="location"
          {...register("location", {
            maxLength: {
              value: 255,
              message: "Location must be at most 255 characters",
            },
          })}
          placeholder="Location"
          type="text"
        />
        {errors.location && (
          <FormErrorMessage>{errors.location.message}</FormErrorMessage>
        )}
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing={4} mt={6}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={!isDirty}
          flex={1}
          px={6}
          py={3}
        >
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          isDisabled={isSubmitting}
          flex={1}
          px={6}
          py={3}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  )
}

export default EditProducer
