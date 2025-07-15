import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import { images_url } from "../../utils";
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

// const imagesArray = React.useMemo(() => {
//     if (itemData?.images && typeof itemData.images === "string") {
//     return itemData.images
//         .split(",")
//         .map((img) => images_url.concat(img.trim()))
//         .filter(Boolean);
//     }
//     return [];
// }, [itemData]);

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

        if (!item?.images) return null
        const [firstImage] = item.images.split(",")

        if (!firstImage?.trim()) return null
        const image_url = images_url.concat(item.id, "/", item.owner_id, "/", firstImage.trim())

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
              <Text>This is a placeholder for text fields that can be populated later.</Text>
            </Box>
            </Flex>
          )
      })}
    </Box>
  )
}
