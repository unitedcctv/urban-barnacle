import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { type ApiError, type ProducerPublic, type ProducerUpdate } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import {
  producersReadProducers,
  producersUpdateProducer,
  producersCreateProducer,
} from "../../client/sdk.gen"

export const Route = createFileRoute("/_layout/producer")({
  component: Admin,
})

function Admin() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })

  // Fetch producers (for now, we'll assume there's one producer per user)
  const {
    data: producers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["producers"],
    queryFn: async () => {
      return producersReadProducers()
    },
  })

  const currentProducer = producers?.data?.[0] as ProducerPublic | undefined

  // Update producer mutation
  const updateProducerMutation = useMutation({
    mutationFn: async (data: ProducerUpdate) => {
      if (!currentProducer) throw new Error("No producer to update")
      return producersUpdateProducer({ id: currentProducer.id, requestBody: data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      showToast("Success!", "Producer details updated successfully.", "success")
      setIsEditing(false)
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  // Create producer mutation
  const createProducerMutation = useMutation({
    mutationFn: async (data: { name: string; location?: string }) => {
      return producersCreateProducer({ requestBody: data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producers"] })
      showToast("Success!", "Producer profile created successfully.", "success")
      setIsEditing(false)
    },
    onError: (err: ApiError) => {
      const errDetail = (err.body as any)?.detail
      showToast("Something went wrong.", `${errDetail}`, "error")
    },
  })

  const handleEdit = () => {
    if (currentProducer) {
      setFormData({
        name: currentProducer.name,
        location: currentProducer.location || "",
      })
    }
    setIsEditing(true)
  }

  const handleSave = () => {
    if (currentProducer) {
      updateProducerMutation.mutate(formData)
    } else {
      createProducerMutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({ name: "", location: "" })
  }

  if (isLoading) {
    return (
      <Container maxW="full">
        <Text>Loading...</Text>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container maxW="full">
        <Text color="red.500">Error loading producer data</Text>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Producer Admin
      </Heading>

      <Box
        p={6}
        mt={6}
      >
        {!currentProducer && !isEditing ? (
          <VStack spacing={4}>
            <Text>No producer profile found. Create one to get started.</Text>
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Create Producer Profile
            </Button>
          </VStack>
        ) : (
          <Stack spacing={4}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Producer Details</Heading>
              {!isEditing && (
                <Button variant="primary" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </Flex>

            {isEditing ? (
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Producer Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter producer name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Enter location"
                  />
                </FormControl>

                <Flex gap={2}>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={
                      updateProducerMutation.isPending ||
                      createProducerMutation.isPending
                    }
                  >
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </Flex>
              </Stack>
            ) : (
              currentProducer && (
                <Stack spacing={3}>
                  <Box>
                    <Text fontWeight="bold">Name:</Text>
                    <Text>{currentProducer.name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Location:</Text>
                    <Text>{currentProducer.location || "Not specified"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Created:</Text>
                    <Text>
                      {new Date(currentProducer.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                </Stack>
              )
            )}
          </Stack>
        )}
      </Box>
    </Container>
  )
}
