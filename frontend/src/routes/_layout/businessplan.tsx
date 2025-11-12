import { DownloadIcon } from "@chakra-ui/icons"
import { Box, Button, HStack, Text, useToast } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import AskBusinessPlan from "../../components/Common/Ask"

export const Route = createFileRoute("/_layout/businessplan")({
  component: BusinessPlan,
})

function BusinessPlan() {
  const toast = useToast()

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const apiBase = import.meta.env.VITE_API_URL ?? ""

      const response = await fetch(`${apiBase}/api/v1/business-plan/download`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download business plan")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "urban-barnacle-business-plan.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: "Business plan PDF is being downloaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Unable to download the business plan. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box p={8} maxW="4xl" mx="auto">
      <HStack justify="flex-end" align="center" mb={6}>
        <Button
          leftIcon={<DownloadIcon color="gray.500" />}
          colorScheme="blue"
          bg="ui.main"
          color="white"
          _hover={{ bg: "ui.dark" }}
          onClick={handleDownloadPDF}
          sx={{
            "& svg": {
              transition: "all 0.2s ease",
            },
            "&:hover svg": {
              color: "#4a90e2",
              transform: "scale(1.15)",
            },
            "&:active svg": {
              transform: "scale(1.05)",
            },
          }}
        >
          Download PDF
        </Button>
      </HStack>
      <Text mb={4}>
        TL;DR: If you have a question about the business plan, ask it here.
      </Text>
      <AskBusinessPlan />
    </Box>
  )
}

export default BusinessPlan
