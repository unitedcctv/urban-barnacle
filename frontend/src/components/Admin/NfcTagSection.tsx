import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useState } from "react"
import type { ApiError } from "../../client/core/ApiError"
import {
  nfcListTags,
  nfcListUntaggedItems,
  nfcRevokeTag,
} from "../../client/sdk.gen"
import type { ItemPublic, NfcTagPublic } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import { PaginationFooter } from "../Common/PaginationFooter"
import AssignTagModal from "./AssignTagModal"

const PER_PAGE = 5

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function UntaggedItemsTable({
  onAssign,
}: {
  onAssign: (item: ItemPublic) => void
}) {
  const [page, setPage] = useState(1)
  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ["nfcUntaggedItems", { page }],
    queryFn: () =>
      nfcListUntaggedItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && data?.data.length === PER_PAGE

  return (
    <Box mb={8}>
      <Heading size="sm" mb={3}>
        Items without a tag
      </Heading>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th width="75%">Item</Th>
              <Th width="25%" />
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(2).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {data?.data.map((item) => (
                <Tr key={item.id}>
                  <Td isTruncated maxWidth="200px">
                    {item.title}
                  </Td>
                  <Td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAssign(item)}
                    >
                      Assign Tag
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      {!isPending && data?.count === 0 && (
        <Text color="gray.500" mt={3}>
          All items have a tag registered.
        </Text>
      )}
      <PaginationFooter
        onChangePage={setPage}
        page={page}
        hasNextPage={hasNextPage}
        hasPreviousPage={page > 1}
      />
    </Box>
  )
}

function RegisteredTagsTable({
  onRevoke,
}: {
  onRevoke: (tag: NfcTagPublic) => void
}) {
  const [page, setPage] = useState(1)
  const { data, isPending, isPlaceholderData } = useQuery({
    queryKey: ["nfcTags", { page }],
    queryFn: () =>
      nfcListTags({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && data?.data.length === PER_PAGE

  return (
    <Box>
      <Heading size="sm" mb={3}>
        Registered tags
      </Heading>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th width="25%">UID</Th>
              <Th width="25%">Item ID</Th>
              <Th width="15%">Status</Th>
              <Th width="10%">Taps</Th>
              <Th width="15%">Registered</Th>
              <Th width="10%" />
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(6).fill(null).map((_, index) => (
                  <Td key={index}>
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {data?.data.map((tag) => (
                <Tr key={tag.id}>
                  <Td fontFamily="monospace">{tag.uid}</Td>
                  <Td isTruncated maxWidth="150px" fontFamily="monospace">
                    {tag.item_id}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={tag.status === "active" ? "green" : "red"}
                    >
                      {tag.status}
                    </Badge>
                  </Td>
                  <Td>{tag.last_read_counter ?? "—"}</Td>
                  <Td>{formatDate(tag.created_at)}</Td>
                  <Td>
                    <Button
                      variant="danger"
                      size="sm"
                      isDisabled={tag.status === "revoked"}
                      onClick={() => onRevoke(tag)}
                    >
                      Revoke
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
      {!isPending && data?.count === 0 && (
        <Text color="gray.500" mt={3}>
          No tags registered yet.
        </Text>
      )}
      <PaginationFooter
        onChangePage={setPage}
        page={page}
        hasNextPage={hasNextPage}
        hasPreviousPage={page > 1}
      />
    </Box>
  )
}

function NfcTagSection() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [assignItem, setAssignItem] = useState<ItemPublic | null>(null)
  const [revokeTag, setRevokeTag] = useState<NfcTagPublic | null>(null)
  const cancelRef = React.useRef<HTMLButtonElement | null>(null)

  const revokeMutation = useMutation({
    mutationFn: (uid: string) => nfcRevokeTag({ uid }),
    onSuccess: () => {
      showToast("Success", "The tag was revoked.", "success")
      setRevokeTag(null)
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nfcTags"] })
      queryClient.invalidateQueries({ queryKey: ["nfcUntaggedItems"] })
    },
  })

  return (
    <Box mt={8}>
      <Heading size="md" mb={4}>
        NFC Tags
      </Heading>
      <UntaggedItemsTable onAssign={setAssignItem} />
      <RegisteredTagsTable onRevoke={setRevokeTag} />

      {assignItem && (
        <AssignTagModal
          item={assignItem}
          isOpen={assignItem !== null}
          onClose={() => setAssignItem(null)}
        />
      )}

      <AlertDialog
        isOpen={revokeTag !== null}
        onClose={() => setRevokeTag(null)}
        leastDestructiveRef={cancelRef}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Revoke NFC Tag</AlertDialogHeader>
            <AlertDialogBody>
              Future taps on tag <strong>{revokeTag?.uid}</strong> will fail
              verification. The tag stays bound to its item and{" "}
              <strong>cannot be re-activated</strong>. Are you sure?
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button
                variant="danger"
                onClick={() =>
                  revokeTag && revokeMutation.mutate(revokeTag.uid)
                }
                isLoading={revokeMutation.isPending}
              >
                Revoke
              </Button>
              <Button
                ref={cancelRef}
                onClick={() => setRevokeTag(null)}
                isDisabled={revokeMutation.isPending}
              >
                Cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default NfcTagSection
