import * as React from "react";
import {
  Button,
  Container,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Box,
} from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/payment/cancel")({
  component: PaymentCancel,
});

function PaymentCancel() {
  const navigate = useNavigate();

  const handleBackToGallery = () => {
    navigate({ to: "/gallery" });
  };

  const handleTryAgain = () => {
    navigate({ to: "/gallery" });
  };

  return (
    <Container maxW="container.md" centerContent py={8}>
      <VStack spacing={6}>
        <Alert status="warning">
          <AlertIcon />
          Payment Canceled
        </Alert>
        
        <Box textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Payment was canceled
          </Text>
          <Text fontSize="lg" color="gray.600" mb={4}>
            No charges were made to your account.
          </Text>
          <Text color="gray.500">
            You can try purchasing the model again or continue browsing our gallery.
          </Text>
        </Box>

        <VStack spacing={4}>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleTryAgain}
          >
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={handleBackToGallery}
          >
            Back to Gallery
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}
