import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import { Box, Text, Heading, Flex } from "@chakra-ui/react"
import ErrorPage from "../../components/Common/ErrorPage"
import HoldingPage from "../../components/Common/HoldingPage"

export const Route = createFileRoute("/_layout/")({
    component: Home,
})

const ITEM_COUNT = 5

function getItemsQueryOptions() {
  return {
    queryFn: () => itemsReadItems({ skip: 0, limit: ITEM_COUNT }),
    queryKey: ["items"],
  }
}

export default function Home() {
  const { data: items, isLoading, isError, error } = useQuery({
    ...getItemsQueryOptions(),
    enabled:
      typeof window !== "undefined" &&
      localStorage.getItem("access_token") !== null,
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError) {
    return <ErrorPage message={error instanceof Error ? error.message : undefined} />
  }

  if (!items || items.data.length === 0) {
    return <HoldingPage />
  }

  return (
    <Box>
      {items.data.map((item: any) => {

        if (!item?.image_urls || item.image_urls.length === 0) return null
        const image_url = item.image_urls[0]

          return (
            <Flex
              key={item.id}
              bgImage={`url(${image_url})`}
              bgAttachment="fixed"
              bgSize="cover"
              bgPosition="center"
              h="72rem"
              mb="2rem"
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
              <Heading size="lg" mb={2}>
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
