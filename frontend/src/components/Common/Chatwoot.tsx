import { Box, Button, Link, Text } from "@chakra-ui/react"
import { useState } from "react"

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble: boolean
      position: string
      locale: string
    }
    chatwootSDK?: {
      run: (options: { websiteToken: string; baseUrl: string }) => void
    }
    $chatwoot?: { toggle: (state: "open" | "close") => void }
  }
}

let loading: Promise<void> | undefined

function loadChat(baseUrl: string, websiteToken: string) {
  if (window.$chatwoot) return Promise.resolve()
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    const cleanup = () => {
      window.clearTimeout(timeout)
      window.removeEventListener("chatwoot:ready", ready)
    }
    const ready = () => {
      cleanup()
      resolve()
    }
    const fail = () => {
      cleanup()
      script.remove()
      reject(new Error("Chat is unavailable"))
    }
    const timeout = window.setTimeout(fail, 20000)
    window.addEventListener("chatwoot:ready", ready)
    window.chatwootSettings = {
      hideMessageBubble: true,
      position: "right",
      locale: "en",
    }
    script.src = `${baseUrl}/packs/js/sdk.js`
    script.async = true
    script.onerror = fail
    script.onload = () => {
      if (!window.chatwootSDK) return fail()
      try {
        window.chatwootSDK.run({ websiteToken, baseUrl })
      } catch {
        fail()
      }
    }
    document.head.appendChild(script)
  }).catch((error) => {
    loading = undefined
    throw error
  })
  return loading
}

export default function Chatwoot() {
  const baseUrl = import.meta.env.VITE_CHATWOOT_BASE_URL?.replace(/\/+$/, "")
  const websiteToken = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN
  const [isLoading, setIsLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!baseUrl || !websiteToken) return null

  const openChat = async () => {
    setIsLoading(true)
    setFailed(false)
    try {
      await loadChat(baseUrl, websiteToken)
      window.$chatwoot?.toggle("open")
    } catch {
      setFailed(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      position="fixed"
      right={{ base: 4, md: 6 }}
      bottom="calc(64px + env(safe-area-inset-bottom))"
      zIndex={1100}
      maxW="calc(100vw - 32px)"
    >
      {failed && (
        <Box
          role="alert"
          bg="white"
          color="gray.800"
          p={3}
          mb={2}
          borderRadius="md"
          boxShadow="md"
          maxW="280px"
        >
          <Text fontSize="sm">
            Sorry, chat is unavailable. Please email{" "}
            <Link href="mailto:karl@ubdm.io" textDecoration="underline">
              karl@ubdm.io
            </Link>
            .
          </Text>
        </Box>
      )}
      <Button
        onClick={openChat}
        variant="primary"
        minH="44px"
        isLoading={isLoading}
        loadingText="Opening chat…"
        boxShadow="md"
      >
        Chat with us
      </Button>
    </Box>
  )
}
