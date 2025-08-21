import { Container, SkeletonText, Box } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { producersReadProducers } from "../../client/sdk.gen";
import ProducerCard from "../../components/Producers/ProducerCard";
import { PaginationFooter } from "../../components/Common/PaginationFooter";

export const Route = createFileRoute("/_layout/producers")({
  component: ProducersPage,
  validateSearch: (search) => producersSearchSchema.parse(search),
});

const producersSearchSchema = z.object({
  page: z.number().catch(1),
});

const PER_PAGE = 20;

function getProducersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      producersReadProducers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["producers", { page }],
  } as const;
}

function ProducersPage() {
  return (
    <Container maxW="full">
      <ProducersGrid />
    </Container>
  );
}

function ProducersGrid() {
  const queryClient = useQueryClient();
  // @ts-ignore: Suppress TypeScript error
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setPage = (page: number) =>
    // @ts-ignore: Suppress TypeScript error
    navigate({ search: (prev: { [key: string]: string }) => ({ ...prev, page }) });

  const {
    data: producers,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getProducersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  });

  const hasNextPage = !isPlaceholderData && producers?.data.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getProducersQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

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
            {producers?.data.map((producer) => (
              <ProducerCard key={producer.id} producer={producer} />
            ))}
          </Box>
        )}
      </Box>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  );
}
