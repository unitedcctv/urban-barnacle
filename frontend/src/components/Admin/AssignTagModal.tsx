import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { ApiError } from "../../client/core/ApiError"
import { nfcRegisterTag } from "../../client/sdk.gen"
import type { ItemPublic } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface AssignTagModalProps {
  item: ItemPublic
  isOpen: boolean
  onClose: () => void
}

type AssignTagForm = {
  uid: string
}

function AssignTagModal({ item, isOpen, onClose }: AssignTagModalProps) {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignTagForm>({ mode: "onBlur" })

  const mutation = useMutation({
    mutationFn: (uid: string) =>
      nfcRegisterTag({
        requestBody: { uid: uid.toUpperCase(), item_id: item.id },
      }),
    onSuccess: () => {
      showToast("Success", `Tag assigned to "${item.title}".`, "success")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nfcUntaggedItems"] })
      queryClient.invalidateQueries({ queryKey: ["nfcTags"] })
    },
  })

  const onSubmit: SubmitHandler<AssignTagForm> = (data) => {
    mutation.mutate(data.uid)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Assign NFC Tag</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text mb={4}>
            Bind a physical tag to <strong>{item.title}</strong>. Enter the
            tag's 7-byte UID (14 hex characters) exactly as read by an NFC
            reader app. This cannot be undone without revoking the tag.
          </Text>
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <FormControl isRequired isInvalid={!!errors.uid}>
              <FormLabel htmlFor="uid">Tag UID</FormLabel>
              <Input
                id="uid"
                {...register("uid", {
                  required: "Tag UID is required.",
                  pattern: {
                    value: /^[0-9A-Fa-f]{14}$/,
                    message: "UID must be 14 hex characters (7 bytes).",
                  },
                })}
                placeholder="e.g. 04A1B2C3D4E5F6"
              />
              {errors.uid && (
                <FormErrorMessage>{errors.uid.message}</FormErrorMessage>
              )}
            </FormControl>
            <HStack spacing={4} mt={6}>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting || mutation.isPending}
                flex={1}
              >
                Assign Tag
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                isDisabled={isSubmitting}
                flex={1}
              >
                Cancel
              </Button>
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default AssignTagModal
