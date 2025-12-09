import { Box, Container, Flex, SkeletonText, Spinner } from "@chakra-ui/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useCallback } from "react"
import { producersReadProducers } from "../../client/sdk.gen"
import ProducerCard from "../../components/Producers/ProducerCard"

export const Route = createFileRoute("/_layout/producers")({
  component: ProducersPage,
})

const PER_PAGE = 20

function ProducersPage() {
  return (
    <Container maxW="full">
      <ProducersGrid />
    </Container>
  )
}

function ProducersGrid() {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["producers"],
    queryFn: ({ pageParam = 0 }) =>
      producersReadProducers({ skip: pageParam, limit: PER_PAGE }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length < PER_PAGE) return undefined
      return allPages.length * PER_PAGE
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

  const allProducers = data?.pages.flatMap((page) => page.data) ?? []

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
            {allProducers.map((producer) => (
              <ProducerCard key={producer.id} producer={producer} />
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
