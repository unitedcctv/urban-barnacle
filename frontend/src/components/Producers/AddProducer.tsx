import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { ApiError } from "../../client/core/ApiError"
import { producersCreateProducer } from "../../client/sdk.gen"
import type { ProducerCreate } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface AddProducerProps {
  isOpen: boolean
  onClose: () => void
}

const AddProducer = ({ isOpen, onClose }: AddProducerProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProducerCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      location: "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        location: "",
      })
    }
  }, [isOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: ProducerCreate) =>
      producersCreateProducer({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Producer profile created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      queryClient.invalidateQueries({ queryKey: ["myProducer"] })
    },
  })

  const onSubmit: SubmitHandler<ProducerCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create Producer Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} w="100%">
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
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Profile
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddProducer
