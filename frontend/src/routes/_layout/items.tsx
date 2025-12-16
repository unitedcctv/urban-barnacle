import { Box, Container, Flex, SkeletonText, Spinner } from "@chakra-ui/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useCallback } from "react"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import ItemCard from "../../components/Items/ItemCard.tsx"

export const Route = createFileRoute("/_layout/items")({
  component: Dashboard,
})

const PER_PAGE = 20

function Dashboard() {
  return (
    <Container maxW="full">
      <ItemsGrid />
    </Container>
  )
}

function ItemsGrid() {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["items", "infinite", PER_PAGE],
    queryFn: ({ pageParam = 0 }) =>
      itemsReadItems({ skip: pageParam, limit: PER_PAGE }),
    getNextPageParam: (lastPage, allPages) => {
      const lastPageData = Array.isArray(lastPage?.data) ? lastPage.data : []
      if (lastPageData.length < PER_PAGE) return undefined
      const pagesCount = Array.isArray(allPages) ? allPages.length : 0
      return pagesCount * PER_PAGE
    },
    initialPageParam: 0,
  })

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [handleObserver])

  const allItems = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <>
      <Box>
        {isPending ? (
          <Box className="grid-container">
            {new Array(5).fill(null).map((_, index) => (
              <Box key={index} className="grid-item">
                <SkeletonText noOfLines={1} paddingBlock="16px" />
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="grid-container">
            {allItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Box>
        )}
      </Box>
      <Flex ref={loadMoreRef} justify="center" py={4}>
        {isFetchingNextPage && <Spinner size="lg" />}
      </Flex>
    </>
  )
}
