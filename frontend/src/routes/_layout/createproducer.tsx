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

export const Route = createFileRoute("/_layout/createproducer")({
  component: CreateProducer,
})

function CreateProducer() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const navigate = useNavigate()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
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
      // Step 1: Create the producer profile
      const createdProducer = await producersCreateProducer({ requestBody: data })
      
      // Step 2: Upload logo if provided
      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${createdProducer.id}?entity_type=producer&image_type=logo`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          },
        )
        if (!response.ok) {
          throw new Error("Failed to upload logo")
        }
      }
      
      // Step 3: Upload portfolio images if provided
      for (const file of portfolioFiles) {
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${createdProducer.id}?entity_type=producer&image_type=portfolio`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          },
        )
        if (!response.ok) {
          throw new Error("Failed to upload portfolio image")
        }
      }
      
      return createdProducer
    },
    onSuccess: () => {
      showToast("Success!", "Producer profile created successfully.", "success")
      reset()
      setLogoFile(null)
      setPortfolioFiles([])
      setLogoPreview(null)
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
    setLogoFile(null)
    setPortfolioFiles([])
    setLogoPreview(null)
    setPortfolioPreviews([])
    navigate({ to: "/producers" })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
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
      setPortfolioFiles((prev) => [...prev, ...files])
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
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index))
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
        >
          {portfolioFiles.length > 0
            ? `Add More Images (${portfolioFiles.length} selected)`
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
