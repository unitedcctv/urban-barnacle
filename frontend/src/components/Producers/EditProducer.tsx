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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { ApiError } from "../../client/core/ApiError"
import { producersUpdateProducer } from "../../client/sdk.gen"
import type { ProducerPublic, ProducerUpdate } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import ImagesUploader from "../Common/ImagesUploader"

interface EditProducerProps {
  producer: ProducerPublic
  isOpen: boolean
  onClose: () => void
}

const EditProducer = ({ producer, isOpen, onClose }: EditProducerProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [imagesChanged, setImagesChanged] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch existing logo images
  const { data: logoImages = [] } = useQuery({
    queryKey: ["producerImages", producer.id, "logo"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/producer/${producer.id}?image_type=logo`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      if (!response.ok) throw new Error("Failed to fetch logo images")
      const data = await response.json()
      // Return array of image objects with id, name, and path
      return data.map((img: any) => ({
        id: img.id,
        name: img.name,
        url: img.path,
      }))
    },
    enabled: !!producer.id && isOpen,
  })

  // Fetch existing portfolio images
  const { data: portfolioImages = [] } = useQuery({
    queryKey: ["producerImages", producer.id, "portfolio"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/producer/${producer.id}?image_type=portfolio`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      if (!response.ok) throw new Error("Failed to fetch portfolio images")
      const data = await response.json()
      // Return array of image objects with id, name, and path
      return data.map((img: any) => ({
        id: img.id,
        name: img.name,
        url: img.path,
      }))
    },
    enabled: !!producer.id && isOpen,
  })
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProducerUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: producer,
  })

  useEffect(() => {
    reset(producer)
    setImagesChanged(false)
  }, [producer, reset])

  // Track form changes including images
  const watchedValues = watch()
  useEffect(() => {
    const formChanged = isDirty || imagesChanged
    setHasChanges(formChanged)
  }, [isDirty, imagesChanged, watchedValues])

  const handleImagesChange = () => {
    setImagesChanged(true)
  }

  const mutation = useMutation({
    mutationFn: (data: ProducerUpdate) =>
      producersUpdateProducer({ id: producer.id, requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Producer profile updated successfully.", "success")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      queryClient.invalidateQueries({ queryKey: ["myProducer"] })
      queryClient.invalidateQueries({ queryKey: ["producerImages", producer.id] })
    },
  })

  const onSubmit: SubmitHandler<ProducerUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "2xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Edit Producer Profile</ModalHeader>
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
            <FormControl mt={4}>
              <FormLabel>Logo</FormLabel>
              <ImagesUploader
                producerId={producer.id}
                imageType="logo"
                entityType="producer"
                existingImages={logoImages}
                onImagesChange={handleImagesChange}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Portfolio Images</FormLabel>
              <ImagesUploader
                producerId={producer.id}
                imageType="portfolio"
                entityType="producer"
                existingImages={portfolioImages}
                onImagesChange={handleImagesChange}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              isDisabled={!hasChanges}
            >
              Save Changes
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default EditProducer
