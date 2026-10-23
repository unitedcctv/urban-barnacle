import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  useMediaQuery,
  usePrefersReducedMotion,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import ErrorPage from "../../components/Common/ErrorPage"
import HoldingPage from "../../components/Common/HoldingPage"
import LoadingLogo from "../../components/Common/LoadingLogo"
import ItemsGrid from "../../components/Items/ItemsGrid"

export const Route = createFileRoute("/_layout/")({
  component: Home,
})

const ITEM_COUNT = 5

function getItemsQueryOptions() {
  return {
    queryFn: () =>
      itemsReadItems({
        query: { skip: 0, limit: ITEM_COUNT },
        throwOnError: true,
      }),
    queryKey: ["items", "home", ITEM_COUNT],
  }
}

export default function Home() {
  const [isSmUp] = useMediaQuery("(min-width: 30em)")
  const prefersReducedMotion = usePrefersReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasGalleryItems, setHasGalleryItems] = useState(false)

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getItemsQueryOptions(),
    enabled: typeof window !== "undefined" && isSmUp,
  })

  const itemsList = (items?.data ?? []).filter((item) =>
    Boolean(item.image_urls?.[0]?.trim()),
  )
  const hasContent = isSmUp
    ? !isLoading && !isError && itemsList.length > 0
    : hasGalleryItems

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    })
  }

  const renderContent = () => {
    // On mobile, land on the gallery instead of the logo-only holding page
    if (!isSmUp) {
      return (
        <Container maxW="full">
          <ItemsGrid onHasItemsChange={setHasGalleryItems} />
        </Container>
      )
    }

    if (isLoading) {
      return (
        <Box
          height="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <LoadingLogo size="526px" />
        </Box>
      )
    }

    if (isError) {
      return (
        <ErrorPage
          message={error instanceof Error ? error.message : undefined}
        />
      )
    }

    return (
      <Box bg="black">
        {itemsList.map((item) => {
          const image_url = item.image_urls?.[0]

          return (
            <Flex
              key={item.id}
              bgImage={`url(${image_url})`}
              bgAttachment={{ base: "scroll", sm: "fixed" }}
              bgSize={{ base: "contain", sm: "cover" }}
              bgRepeat="no-repeat"
              bgPosition="center"
              h={{ base: "100dvh", sm: "100vh" }}
              mb={0}
              align="center"
              justify="center"
              direction="column"
              color="white"
              position="relative"
            >
              <Box
                w="30%"
                padding="1rem"
                bg="rgba(0,0,0,0.5)"
                position="absolute"
                left={0}
              >
                <Heading size="md" mb={2}>
                  {item.title ?? "Parallax Title"}
                </Heading>
                <Text>{item.description}</Text>
              </Box>
            </Flex>
          )
        })}
      </Box>
    )
  }

  return (
    <>
      <HoldingPage onExplore={hasContent ? scrollToContent : undefined} />
      <Box ref={contentRef} scrollMarginTop={{ base: 0, sm: "52px" }}>
        {renderContent()}
      </Box>
    </>
  )
}
