import { Box, Flex, Heading, Text, useMediaQuery } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import ErrorPage from "../../components/Common/ErrorPage"
import HoldingPage from "../../components/Common/HoldingPage"
import LoadingLogo from "../../components/Common/LoadingLogo"

export const Route = createFileRoute("/_layout/")({
  component: Home,
})

const ITEM_COUNT = 5

function getItemsQueryOptions() {
  return {
    queryFn: () => itemsReadItems({ skip: 0, limit: ITEM_COUNT }),
    queryKey: ["items", "home", ITEM_COUNT],
  }
}

export default function Home() {
  const [isSmUp] = useMediaQuery("(min-width: 30em)")

  const {
    data: items,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getItemsQueryOptions(),
    enabled: typeof window !== "undefined" && isSmUp,
  })

  const itemsList = items?.data ?? []

  if (!isSmUp) {
    return <HoldingPage />
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
      <ErrorPage message={error instanceof Error ? error.message : undefined} />
    )
  }

  if (!items || itemsList.length === 0) {
    return <HoldingPage />
  }

  return (
    <Box bg="black">
      {itemsList.map((item: any) => {
        if (!item?.image_urls || item.image_urls.length === 0) return null
        const image_url = item.image_urls[0]

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
