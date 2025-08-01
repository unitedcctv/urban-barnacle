import {
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
  Text,
} from "@chakra-ui/react"
import {
  Link as RouterLink,
  // createFileRoute,
  // redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { UserRegister } from "../../client"
// import useAuth, { isLoggedIn } from "../../hooks/useAuth"
import useAuth from "../../hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "../../utils"

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

interface SignUpProps {
  onClose?: () => void
  openLogin?: () => void
}

function SignUp({ onClose, openLogin }: SignUpProps = {}) {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    signUpMutation.mutate(data, {
      onSuccess: () => {
        // Close the modal after successful signup
        if (onClose) {
          onClose()
        }
      }
    })
  }

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center">
        <Container
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          maxW="sm"
          alignItems="stretch"
          justifyContent="center"
          gap={4}
          centerContent
        >
          <FormControl id="full_name" isInvalid={!!errors.full_name}>
            <FormLabel htmlFor="full_name" srOnly>
              Full Name
            </FormLabel>
            <Input
              id="full_name"
              minLength={3}
              {...register("full_name", { required: "Full Name is required" })}
              placeholder="Full Name"
              type="text"
            />
            {errors.full_name && (
              <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel htmlFor="username" srOnly>
              Email
            </FormLabel>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel htmlFor="password" srOnly>
              Password
            </FormLabel>
            <Input
              id="password"
              {...register("password", passwordRules())}
              placeholder="Password"
              type="password"
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            id="confirm_password"
            isInvalid={!!errors.confirm_password}
          >
            <FormLabel htmlFor="confirm_password" srOnly>
              Confirm Password
            </FormLabel>

            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Repeat Password"
              type="password"
            />
            {errors.confirm_password && (
              <FormErrorMessage>
                {errors.confirm_password.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Sign Up
          </Button>
          <Text>
            Already have an account?{" "}
            <Link
              as={RouterLink}
              to="/login"
              color="blue.500"
              onClick={(e) => {
                if (onClose || openLogin) {
                  e.preventDefault()
                  onClose?.()
                  if (openLogin) setTimeout(openLogin, 0)
                }
              }}
            >
              Log In
            </Link>
          </Text>
        </Container>
      </Flex>
    </>
  )
}

export default SignUp
