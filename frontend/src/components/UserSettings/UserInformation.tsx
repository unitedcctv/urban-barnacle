import {
  Box,
  Button,
  Flex,
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
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { ApiError } from "../../client/core/ApiError"
import { usersUpdateUserMe } from "../../client/sdk.gen"
import type { UserPublic, UserUpdateMe } from "../../client/types.gen"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

function UserInformation() {
  const queryClient = useQueryClient()
  const color = useColorModeValue("inherit", "ui.light")
  const showToast = useCustomToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user: currentUser } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      usersUpdateUserMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    onClose()
  }

  const permissions = currentUser?.permissions?.split(",")

  return (
    <Box w="full">
      {/* Display Mode */}
      <VStack spacing={0} align="flex-start" w="full" padding={0}>
        <Box w="full">
          <Text fontSize="sm" color={color} fontWeight="medium" mb={1}>
            Name
          </Text>
          <Text
            size="md"
            py={2}
            color={!currentUser?.full_name ? "ui.dim" : "inherit"}
            w="full"
          >
            {currentUser?.full_name || "N/A"}
          </Text>
        </Box>

        <Box w="full">
          <Text fontSize="sm" color={color} fontWeight="medium" mb={1}>
            Email
          </Text>
          <Text size="md" py={2} w="full">
            {currentUser?.email}
          </Text>
        </Box>

        {permissions && permissions.length > 0 && (
          <Box w="full" fontSize="sm" color="ui.dim" mt={4}>
            <Text>
              <Text as="span" fontWeight="medium">
                Permissions:{" "}
              </Text>
              {permissions.join(", ")}
            </Text>
          </Box>
        )}

        <Button variant="primary" onClick={onOpen} mt={4}>
          Edit
        </Button>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Personal Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4} align="flex-start" w="full">
                <FormControl w="full">
                  <FormLabel color={color} htmlFor="name">
                    Name
                  </FormLabel>
                  <Input
                    id="name"
                    {...register("full_name", { maxLength: 30 })}
                    type="text"
                    size="md"
                    w="full"
                  />
                </FormControl>

                <FormControl w="full" isInvalid={!!errors.email}>
                  <FormLabel color={color} htmlFor="email">
                    Email
                  </FormLabel>
                  <Input
                    id="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: emailPattern,
                    })}
                    type="email"
                    size="md"
                    w="full"
                    value={getValues("email")}
                  />
                  {errors.email && (
                    <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                  )}
                </FormControl>
              </VStack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Flex gap={3}>
              <Button onClick={onCancel} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                isDisabled={!isDirty || !getValues("email")}
              >
                Save
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default UserInformation
