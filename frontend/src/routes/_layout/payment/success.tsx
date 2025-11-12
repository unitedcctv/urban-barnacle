import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Link,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/payment/success")({
  component: PaymentSuccess,
})

interface PaymentSuccessData {
  message: string
  download_url: string
  item_title: string
  expires_in: string
}

function PaymentSuccess() {
  const search = useSearch({ from: Route.id })
  const sessionId = (search as { session_id?: string }).session_id
  const navigate = useNavigate()
  const showToast = useCustomToast()

  const [loading, setLoading] = React.useState(true)
  const [paymentData, setPaymentData] =
    React.useState<PaymentSuccessData | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("No session ID provided")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/v1/payments/success?session_id=${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Payment verification failed")
        }

        const data = await response.json()
        setPaymentData(data)
        showToast("Success!", "Payment completed successfully!", "success")
      } catch (error) {
        console.error("Payment verification error:", error)
        setError(
          error instanceof Error
            ? error.message
            : "Payment verification failed",
        )
        showToast("Error", "Failed to verify payment", "error")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId, showToast])

  const handleDownload = () => {
    if (paymentData?.download_url) {
      window.open(paymentData.download_url, "_blank")
    }
  }

  const handleBackToItems = () => {
    navigate({ to: "/items" })
  }

  if (loading) {
    return (
      <Container maxW="container.md" centerContent py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="green.500" />
          <Text>Verifying your payment...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.md" centerContent py={8}>
        <VStack spacing={6}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
          <Button onClick={handleBackToItems}>Back to Items</Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.md" centerContent py={8}>
      <VStack spacing={6}>
        <Alert status="success">
          <AlertIcon />
          Payment Successful!
        </Alert>

        <Box textAlign="center">
          <Text fontSize="2xl" mb={2}>
            Thank you for your purchase!
          </Text>
          <Text fontSize="lg" color="gray.600">
            {paymentData?.item_title} - 3D Model
          </Text>
        </Box>

        <Box textAlign="center">
          <Text mb={4}>
            Your download is ready! Click the button below to download your 3D
            model.
          </Text>
          <Text fontSize="sm" color="gray.500" mb={4}>
            Download link expires in {paymentData?.expires_in}
          </Text>

          <VStack spacing={4}>
            <Button colorScheme="green" size="lg" onClick={handleDownload}>
              Download 3D Model
            </Button>

            <Button variant="outline" onClick={handleBackToItems}>
              Back to Items
            </Button>
          </VStack>
        </Box>

        <Box textAlign="center" fontSize="sm" color="gray.500">
          <Text>
            Need help? Contact us at{" "}
            <Link href="mailto:support@example.com" color="blue.500">
              support@example.com
            </Link>
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
