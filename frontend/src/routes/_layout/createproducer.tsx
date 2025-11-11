import { DeleteIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { ApiError } from "../../client/core/ApiError"
import { producersCreateProducer } from "../../client/sdk.gen"
import type { ProducerCreate } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import uploadIcon from "../../theme/assets/icons/upload.svg"

export const Route = createFileRoute("/_layout/createproducer")({
  component: CreateProducer,
})

function CreateProducer() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const navigate = useNavigate()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [portfolioImages, setPortfolioImages] = useState<File[]>([])
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])

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
      logo_url: undefined,
      portfolio_images: undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ProducerCreate) => {
      // Upload logo if provided
      if (logoPreview) {
        const logoInput = document.getElementById(
          "logo-upload",
        ) as HTMLInputElement
        if (logoInput?.files?.[0]) {
          const formData = new FormData()
          formData.append("file", logoInput.files[0])
          try {
            // Use a temporary UUID for the upload since we don't have a producer ID yet
            const tempId = crypto.randomUUID()
            const response = await fetch(
              `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${tempId}?entity_type=producer`,
              {
                method: "POST",
                body: formData,
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "access_token",
                  )}`,
                },
              },
            )
            if (response.ok) {
              const imageData = await response.json()
              data.logo_url = imageData.path
            }
          } catch (error) {
            console.error("Error uploading logo:", error)
          }
        }
      }

      // Upload portfolio images if provided
      if (portfolioImages.length > 0) {
        const uploadedUrls: string[] = []
        for (const file of portfolioImages) {
          const formData = new FormData()
          formData.append("file", file)
          try {
            // Use a temporary UUID for each upload since we don't have a producer ID yet
            const tempId = crypto.randomUUID()
            const response = await fetch(
              `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${tempId}?entity_type=producer`,
              {
                method: "POST",
                body: formData,
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "access_token",
                  )}`,
                },
              },
            )
            if (response.ok) {
              const imageData = await response.json()
              uploadedUrls.push(imageData.path)
            }
          } catch (error) {
            console.error("Error uploading portfolio image:", error)
          }
        }
        if (uploadedUrls.length > 0) {
          data.portfolio_images = uploadedUrls.join(",")
        }
      }

      return producersCreateProducer({ requestBody: data })
    },
    onSuccess: () => {
      showToast("Success!", "Producer profile created successfully.", "success")
      reset()
      setLogoPreview(null)
      setPortfolioImages([])
      setPortfolioPreviews([])
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      queryClient.invalidateQueries({ queryKey: ["myProducer"] })
      queryClient.invalidateQueries({ queryKey: ["navigation"] })
      navigate({ to: "/producers" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<ProducerCreate> = (data) => {
    mutation.mutate(data)
  }

  const handleCancel = () => {
    reset()
    setLogoPreview(null)
    setPortfolioImages([])
    setPortfolioPreviews([])
    navigate({ to: "/producers" })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setPortfolioImages((prev) => [...prev, ...files])

      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPortfolioPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePortfolioImage = (index: number) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index))
    setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index))
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

      {/* Logo Upload */}
      <FormControl mt={4}>
        <FormLabel htmlFor="logo-upload">Company Logo</FormLabel>
        <Input
          id="logo-upload"
          type="file"
          accept="image/*"
          display="none"
          onChange={handleLogoChange}
        />
        <Button
          variant="primary"
          onClick={() => document.getElementById("logo-upload")?.click()}
          leftIcon={
            <Image
              src={uploadIcon}
              alt="upload"
              boxSize="20px"
              sx={{
                transition: "filter 0.2s ease",
                _groupHover: {
                  filter: "brightness(0) saturate(100%) invert(47%) sepia(96%) saturate(1787%) hue-rotate(197deg) brightness(98%) contrast(101%)",
                },
              }}
            />
          }
          role="group"
        >
          {logoPreview ? "Change Logo" : "Upload Logo"}
        </Button>
        {logoPreview && (
          <Box mt={2}>
            <Image
              src={logoPreview}
              alt="Logo preview"
              maxH="150px"
              borderRadius="md"
            />
            <Text mt={2} fontSize="sm" color="green.500">
              ✓ Logo selected
            </Text>
          </Box>
        )}
      </FormControl>

      {/* Portfolio Images Upload */}
      <FormControl mt={4}>
        <FormLabel htmlFor="portfolio-upload">Example Work Images</FormLabel>
        <Input
          id="portfolio-upload"
          type="file"
          accept="image/*"
          multiple
          display="none"
          onChange={handlePortfolioChange}
        />
        <Button
          variant="primary"
          onClick={() => document.getElementById("portfolio-upload")?.click()}
          leftIcon={
            <Image
              src={uploadIcon}
              alt="upload"
              boxSize="20px"
              sx={{
                transition: "filter 0.2s ease",
                _groupHover: {
                  filter: "brightness(0) saturate(100%) invert(47%) sepia(96%) saturate(1787%) hue-rotate(197deg) brightness(98%) contrast(101%)",
                },
              }}
            />
          }
          role="group"
        >
          {portfolioImages.length > 0
            ? `Add More Images (${portfolioImages.length} selected)`
            : "Upload Portfolio Images"}
        </Button>
        {portfolioPreviews.length > 0 && (
          <Box mt={2}>
            <Text fontSize="sm" color="green.500" mb={2}>
              ✓ {portfolioPreviews.length} image
              {portfolioPreviews.length > 1 ? "s" : ""} selected
            </Text>
            <VStack align="stretch" spacing={2}>
              {portfolioPreviews.map((preview, index) => (
                <Flex
                  key={index}
                  align="center"
                  justify="space-between"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={2}
                >
                  <Image
                    src={preview}
                    alt={`Portfolio ${index + 1}`}
                    maxH="80px"
                    borderRadius="md"
                  />
                  <IconButton
                    aria-label="Remove image"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removePortfolioImage(index)}
                  />
                </Flex>
              ))}
            </VStack>
          </Box>
        )}
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing={4} mt={6}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          flex={1}
          px={6}
          py={3}
        >
          Create Profile
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

export default CreateProducer
