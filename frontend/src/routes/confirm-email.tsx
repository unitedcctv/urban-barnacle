import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { OpenAPI } from "../client"

export const Route = createFileRoute("/confirm-email")({
  component: ConfirmEmail,
})

function ConfirmEmail() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/confirm-email" })
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      const token = (search as any).token

      if (!token) {
        setStatus("error")
        setMessage("No confirmation token provided")
        return
      }

      try {
        const response = await fetch(
          `${OpenAPI.BASE}/api/v1/users/confirm-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || "Failed to confirm email")
        }

        setStatus("success")
        setMessage(data.message)
      } catch (error: any) {
        setStatus("error")
        setMessage(error.message || "Failed to confirm email")
      }
    }

    confirmEmail()
  }, [search])

  const handleGoToLogin = () => {
    navigate({ to: "/" })
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Heading size="lg" textAlign="center">
          Email Confirmation
        </Heading>

        {status === "loading" && (
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Confirming your email address...</Text>
          </VStack>
        )}

        {status === "success" && (
          <VStack spacing={4}>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text>Email Confirmed!</Text>
                <Text>{message}</Text>
              </Box>
            </Alert>
            <Button colorScheme="blue" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </VStack>
        )}

        {status === "error" && (
          <VStack spacing={4}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text>Confirmation Failed</Text>
                <Text>{message}</Text>
              </Box>
            </Alert>
            <Button colorScheme="blue" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
