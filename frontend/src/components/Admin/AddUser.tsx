import {
  Box,
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
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { ApiError } from "../../client/core/ApiError"
import { usersCreateUser } from "../../client/sdk.gen"
import type { UserCreate, UserPermission } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"
import LoadingLogo from "../Common/LoadingLogo"
import PermissionsSelector from "./Permissions"

interface AddUserProps {
  isOpen: boolean
  onClose: () => void
}

interface UserCreateForm extends UserCreate {
  confirm_password: string
}

const AddUser = ({ isOpen, onClose }: AddUserProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [permissions, setPermissions] = useState<UserPermission>("guest")
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      permissions: "guest",
      is_active: false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        email: "",
        full_name: "",
        password: "",
        confirm_password: "",
        permissions: "guest" as UserPermission,
        is_active: false,
      })
      setPermissions("guest") // Reset permissions state
    }
  }, [isOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: UserCreate) => usersCreateUser({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    data.permissions = permissions
    // Set all users created by superuser admin to be active by default
    data.is_active = true
    mutation.mutate(data)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
        closeOnOverlayClick={!isSubmitting}
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)} position="relative">
          <ModalHeader>Add User</ModalHeader>
          <ModalCloseButton isDisabled={isSubmitting} />
          {isSubmitting && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(255, 255, 255, 0.9)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={10}
              borderRadius="md"
            >
              <LoadingLogo size="80px" />
            </Box>
          )}
          <ModalBody pb={6} w="100%">
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
                isDisabled={isSubmitting}
              />
              {errors.email && (
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.full_name}>
              <FormLabel htmlFor="name">User Name</FormLabel>
              <Input
                id="name"
                {...register("full_name")}
                placeholder="User Name"
                type="text"
                isDisabled={isSubmitting}
              />
              {errors.full_name && (
                <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isRequired isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">Set Password</FormLabel>
              <Input
                id="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                placeholder="Password"
                type="password"
                isDisabled={isSubmitting}
              />
              {errors.password && (
                <FormErrorMessage>{errors.password.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl
              mt={4}
              isRequired
              isInvalid={!!errors.confirm_password}
            >
              <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
              <Input
                id="confirm_password"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues().password ||
                    "The passwords do not match",
                })}
                placeholder="Password"
                type="password"
                isDisabled={isSubmitting}
              />
              {errors.confirm_password && (
                <FormErrorMessage>
                  {errors.confirm_password.message}
                </FormErrorMessage>
              )}
            </FormControl>
            <PermissionsSelector
              initialPermission={permissions}
              onPermissionChange={(p) => setPermissions(p)}
            />
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting} isDisabled={isSubmitting}>
              Create User
            </Button>
            <Button onClick={onClose} isDisabled={isSubmitting}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddUser
