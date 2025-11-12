import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  useBoolean,
} from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"

import type { Body_login_login_access_token as AccessToken } from "../../client/types.gen"

import useAuth from "../../hooks/useAuth"
import { emailPattern } from "../../utils"

interface LoginProps {
  onClose?: () => void
  openSignUp?: () => void
}

function Login({ onClose, openSignUp }: LoginProps) {
  const [show, setShow] = useBoolean()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <>
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        maxW="sm"
        alignItems="stretch"
        justifyContent="center"
        gap={4}
        centerContent
      >
        <FormControl id="username" isInvalid={!!errors.username || !!error}>
          <Input
            id="username"
            {...register("username", {
              required: "Username is required",
              pattern: emailPattern,
            })}
            placeholder="Email"
            type="email"
            required
          />
          {errors.username && (
            <FormErrorMessage>{errors.username.message}</FormErrorMessage>
          )}
        </FormControl>
        <FormControl id="password" isInvalid={!!error}>
          <InputGroup>
            <Input
              {...register("password", {
                required: "Password is required",
              })}
              type={show ? "text" : "password"}
              placeholder="Password"
              required
            />
            <InputRightElement
              color="gray.500"
              _hover={{
                cursor: "pointer",
                color: "#4a90e2",
                transform: "scale(1.15)",
              }}
              _active={{
                transform: "scale(1.05)",
              }}
              transition="all 0.2s ease"
            >
              <Icon
                as={show ? ViewOffIcon : ViewIcon}
                onClick={setShow.toggle}
                aria-label={show ? "Hide password" : "Show password"}
                className="hover-icon"
              >
                {show ? <ViewOffIcon /> : <ViewIcon />}
              </Icon>
            </InputRightElement>
          </InputGroup>
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>
        <Link as={RouterLink} to="/recover-password" color="blue.500">
          Forgot password?
        </Link>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          Log In
        </Button>
        <Text>
          Don't have an account?{" "}
          <Link
            color="blue.500"
            onClick={() => {
              // Close the login modal first, then open sign-up on next tick so state updates don't clash
              if (onClose) onClose()
              if (openSignUp) setTimeout(openSignUp, 0)
            }}
          >
            Sign up
          </Link>
        </Text>
      </Container>
    </>
  )
}

export default Login
