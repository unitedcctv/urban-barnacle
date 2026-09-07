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
import { useCart } from "../../../context/CartContext"
import useCustomToast from "../../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/payment/success")({
  component: PaymentSuccess,
})

interface PaymentSuccessData {
  message: string
  items: Array<string>
  total: number
  currency: string
}

function PaymentSuccess() {
  const search = useSearch({ from: Route.id })
  const sessionId = (search as { session_id?: string }).session_id
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const { clearCart } = useCart()

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
        clearCart()
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
          {paymentData && paymentData.items.length > 0 && (
            <VStack spacing={1} mb={2}>
              {paymentData.items.map((title) => (
                <Text key={title} fontSize="lg" color="gray.600">
                  {title}
                </Text>
              ))}
            </VStack>
          )}
          {paymentData && (
            <Text fontSize="lg" fontWeight="bold">
              Total: {paymentData.currency === "EUR" ? "€" : `${paymentData.currency} `}
              {paymentData.total.toFixed(2)}
            </Text>
          )}
        </Box>

        <Box textAlign="center">
          <Text mb={4}>
            We'll get in touch about shipping your order.
          </Text>

          <Button variant="outline" onClick={handleBackToItems}>
            Back to Items
          </Button>
        </Box>

        <Box textAlign="center" fontSize="sm" color="gray.500">
          <Text>
            Need help? Contact us at{" "}
            <Link href="mailto:karl@ubdm.io" color="blue.500">
              karl@ubdm.io
            </Link>
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
