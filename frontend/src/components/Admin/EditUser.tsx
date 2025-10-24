import {
  Box,
  Button,
  Checkbox,
  FormControl,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { ApiError } from "../../client/core/ApiError"
import { usersUpdateUser } from "../../client/sdk.gen"
import type {
  UserPermission,
  UserPublic,
  UserUpdate,
} from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import PermissionsCheckboxGroup from "./Permissions"

interface EditUserProps {
  user: UserPublic
  isOpen: boolean
  onClose: () => void
}

interface UserUpdateForm {
  is_active?: boolean
  permissions: string
}

const EditUser = ({ user, isOpen, onClose }: EditUserProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [permissions, setPermissions] = useState<string>(user.permissions || "")

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...user,
      permissions: user.permissions || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateForm) => {
      const updateData: UserUpdate = {
        is_active: data.is_active,
        permissions: data.permissions as any, // Convert string to UserPermission
      }
      return usersUpdateUser({ userId: user.id, requestBody: updateData })
    },
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserUpdateForm> = async (data) => {
    data.permissions = permissions
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
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} w={"100%"}>
            <Box mt={4}>
              <Text>{user.email}</Text>
            </Box>
            <Box mt={4}>
              <Text>{user.full_name || "No name"}</Text>
            </Box>
            <PermissionsCheckboxGroup
              initialPermission={permissions as UserPermission}
              onPermissionChange={setPermissions}
            />
            <FormControl mt={4}>
              <Checkbox {...register("is_active")} colorScheme="teal">
                Is active?
              </Checkbox>
            </FormControl>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default EditUser
