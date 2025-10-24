import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { ApiError } from "../../client/core/ApiError"
import { usersUpdatePasswordMe } from "../../client/sdk.gen"
import type { UpdatePassword } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../../utils"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const color = useColorModeValue("inherit", "ui.light")
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      usersUpdatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Password updated successfully.", "success")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <Box w="full">
      <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
        <VStack spacing={4} align="flex-start" w="full">
          <FormControl
            w="full"
            isRequired
            isInvalid={!!errors.current_password}
          >
            <FormLabel color={color} htmlFor="current_password">
              Current Password
            </FormLabel>
            <Input
              id="current_password"
              {...register("current_password")}
              placeholder="Current Password"
              type="password"
              w="full"
              maxW="400px"
            />
            {errors.current_password && (
              <FormErrorMessage>
                {errors.current_password.message}
              </FormErrorMessage>
            )}
          </FormControl>

          <FormControl w="full" isRequired isInvalid={!!errors.new_password}>
            <FormLabel color={color} htmlFor="password">
              New Password
            </FormLabel>
            <Input
              id="password"
              {...register("new_password", passwordRules())}
              placeholder="New Password"
              type="password"
              w="full"
              maxW="400px"
            />
            {errors.new_password && (
              <FormErrorMessage>{errors.new_password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl
            w="full"
            isRequired
            isInvalid={!!errors.confirm_password}
          >
            <FormLabel color={color} htmlFor="confirm_password">
              Confirm Password
            </FormLabel>
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Confirm New Password"
              type="password"
              w="full"
              maxW="400px"
            />
            {errors.confirm_password && (
              <FormErrorMessage>
                {errors.confirm_password.message}
              </FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            w="full"
            maxW="400px"
          >
            Update Password
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}
export default ChangePassword
