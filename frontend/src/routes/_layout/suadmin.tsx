import {
  Container,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  useToast,
  Flex,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { usersReadUsers } from "../../client/sdk.gen.ts";
import { type UserPublic } from "../../client/types.gen.ts";
import AddUser from "../../components/Admin/AddUser.tsx";
import Navbar from "../../components/Common/Navbar.tsx";
import { PaginationFooter } from "../../components/Common/PaginationFooter.tsx";
import { UserRow } from "../../components/UserSettings/User.tsx";

const usersSearchSchema = z.object({
  page: z.number().catch(1),
});

export const Route = createFileRoute("/_layout/suadmin")({
  component: SuAdmin,
  validateSearch: (search) => usersSearchSchema.parse(search),
});

const PER_PAGE = 5;

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () => usersReadUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  };
}

function UsersTable() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const { page } = Route.useSearch() as { page: number };
  const navigate = useNavigate({ from: Route.fullPath });
  const setPage = (page: number) =>
    // @ts-ignore: Suppress TypeScript error
    navigate({ search: (prev) => ({ ...prev, page }) });

  const {
    data: users,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  });

  const hasNextPage = !isPlaceholderData && users?.data.length === PER_PAGE;
  const hasPreviousPage = page > 1;

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getUsersQueryOptions({ page: page + 1 }));
    }
  }, [page, queryClient, hasNextPage]);

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th width="15%">User Name</Th>
              <Th width="40%">Email</Th>
              <Th width="35%">Permissions</Th>
              <Th width="5%">Status</Th>
              <Th width="5%"></Th>
              <Th width="5%"></Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(4).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {users?.data.map((user) => (
                <UserRow key={user.id} user={user} currentUserId={currentUser?.id} />
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      <PaginationFooter
        onChangePage={setPage}
        page={page}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  );
}

function SuAdmin() {
  const toast = useToast();
  const registerWatch = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/drive/register-watch`, {
        method: "POST",
        credentials: "include", // send cookies if present
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) {
        let errorMessage = "Unknown error occurred";
        try {
          // Try to parse JSON error response
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.message || res.statusText;
        } catch {
          // Fallback to text if JSON parsing fails
          errorMessage = await res.text() || res.statusText;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      toast({ 
        title: "Google Drive watch registered successfully", 
        description: result.message || "Drive watch is now active",
        status: "success",
        duration: 5000
      });
    } catch (err: any) {
      toast({ 
        title: "Failed to register Drive watch", 
        description: err.message || "An unexpected error occurred", 
        status: "error",
        duration: 8000,
        isClosable: true
      });
    }
  };

  const populateChunks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/drive/populate-chunks`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) {
        let errorMessage = "Unknown error occurred";
        try {
          // Try to parse JSON error response
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.message || res.statusText;
        } catch {
          // Fallback to text if JSON parsing fails
          errorMessage = await res.text() || res.statusText;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      toast({ 
        title: "AI chunks populated successfully", 
        description: result.message || "Business plan content is now available for AI chat",
        status: "success",
        duration: 5000
      });
    } catch (err: any) {
      toast({ 
        title: "Failed to populate AI chunks", 
        description: err.message || "An unexpected error occurred", 
        status: "error",
        duration: 8000,
        isClosable: true
      });
    }
  };

  const refreshSocialPosts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/v1/social/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) {
        let errorMessage = "Unknown error occurred";
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.message || res.statusText;
        } catch {
          errorMessage = await res.text() || res.statusText;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      toast({ 
        title: "Social media posts refreshed", 
        description: result.message || "Successfully fetched latest posts from all platforms",
        status: "success",
        duration: 5000
      });
    } catch (err: any) {
      toast({ 
        title: "Failed to refresh social posts", 
        description: err.message || "An unexpected error occurred", 
        status: "error",
        duration: 8000,
        isClosable: true
      });
    }
  };
  return (
    <Container maxW="full">
      <Flex mb={4} gap={4} direction={{ base: "column", md: "row" }}>
        <Navbar type={"User"} addModalAs={AddUser} />
      </Flex>
      <UsersTable />
      <Flex gap={4} wrap="wrap">
        <Button variant="primary" onClick={registerWatch}>
          Register Drive Watch
        </Button>
        <Button variant="primary" onClick={populateChunks}>
          Populate AI Chunks
        </Button>
        <Button variant="primary" onClick={refreshSocialPosts}>
          Refresh Social Posts
        </Button>
        <Button as={Link} to="/logs" variant="primary">
          View Logs
        </Button>
      </Flex>
    </Container>
  );
}

export default SuAdmin;
