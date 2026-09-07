import {
  Box,
  Button,
  Container,
  Divider,
  HStack,
  Heading,
  Image,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useCart } from "../../context/CartContext"
import useCustomToast from "../../hooks/useCustomToast"

export const Route = createFileRoute("/_layout/cart")({
  component: Cart,
})

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`
}

function Cart() {
  const { items, removeItem, total, clearCart } = useCart()
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const [checkingOut, setCheckingOut] = useState(false)
  const subtle = useColorModeValue("gray.600", "gray.400")

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckingOut(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/payments/create-cart-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_ids: items.map((i) => i.id),
            success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/payment/cancel`,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to create checkout session")
      }

      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error("Checkout error:", error)
      showToast(
        "Checkout Error",
        error instanceof Error ? error.message : "Failed to start checkout",
        "error",
      )
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <Container maxW="container.md" py={8} centerContent>
        <VStack spacing={6}>
          <Heading size="lg">Your Cart</Heading>
          <Text color={subtle}>Your cart is empty.</Text>
          <Button variant="primary" onClick={() => navigate({ to: "/items" })}>
            Browse Gallery
          </Button>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Your Cart</Heading>

        {items.map((item) => (
          <HStack
            key={item.id}
            spacing={4}
            align="center"
            justify="space-between"
          >
            <HStack spacing={4} align="center" flex="1" minW={0}>
              {item.image_url && (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  boxSize="64px"
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
              <Box minW={0}>
                <Text fontWeight="bold" noOfLines={1}>
                  {item.title}
                </Text>
                <Text fontSize="sm" color={subtle}>
                  {formatPrice(item.price)}
                </Text>
              </Box>
            </HStack>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={() => removeItem(item.id)}
            >
              Remove
            </Button>
          </HStack>
        ))}

        <Divider />

        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg">
            Total
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {formatPrice(total)}
          </Text>
        </HStack>

        <HStack spacing={4}>
          <Button
            variant="primary"
            size="lg"
            flex={1}
            onClick={handleCheckout}
            isLoading={checkingOut}
            loadingText="Redirecting to payment..."
          >
            Checkout
          </Button>
          <Button variant="outline" onClick={clearCart}>
            Clear
          </Button>
        </HStack>
      </VStack>
    </Container>
  )
}
