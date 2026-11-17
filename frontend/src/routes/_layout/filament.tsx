import { AddIcon, ArrowBackIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Link as ChakraLink,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Select,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import {
  filamentsAdjustLocalStock,
  filamentsDeleteFilament,
  filamentsReadFilaments,
} from "../../client/sdk.gen"
import type { FilamentPublic } from "../../client/types.gen"
import FilamentModal from "../../components/Admin/FilamentModal"
import ImportFilamentsButton from "../../components/Admin/ImportFilamentsButton"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

export const Route = createFileRoute("/_layout/filament")({
  component: FilamentPage,
})

const availabilityLabels: Record<string, string> = {
  InStock: "In stock",
  OutOfStock: "Out of stock",
  SoldOut: "Sold out",
  LimitedAvailability: "Limited availability",
  PreOrder: "Pre-order",
  PreSale: "Pre-sale",
  BackOrder: "Backorder",
  Discontinued: "Discontinued",
  NotListed: "No longer listed",
}

function FilamentPage() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [modalFilament, setModalFilament] = useState<FilamentPublic | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [details, setDetails] = useState<FilamentPublic | null>(null)
  const [search, setSearch] = useState("")
  const [stockFilter, setStockFilter] = useState("all")

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["filaments"],
    queryFn: () => filamentsReadFilaments({ throwOnError: true }),
  })

  const spoolsMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      filamentsAdjustLocalStock({
        path: { id },
        body: { delta },
        throwOnError: true,
      }),
    onError: (err: unknown) => handleError(err, showToast),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["filaments"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      filamentsDeleteFilament({
        path: { id },
        throwOnError: true,
      }),
    onSuccess: () => {
      showToast("Success!", "Filament deleted successfully.", "success")
    },
    onError: (err: unknown) => handleError(err, showToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["filaments"] })
    },
  })

  const adjustSpools = (filament: FilamentPublic, delta: number) => {
    spoolsMutation.mutate({ id: filament.id, delta })
  }

  const handleDelete = (filament: FilamentPublic) => {
    if (window.confirm(`Delete ${filament.colour} filament?`)) {
      deleteMutation.mutate(filament.id)
    }
  }

  const openModal = (filament: FilamentPublic | null) => {
    setModalFilament(filament)
    setIsModalOpen(true)
  }

  const filaments = (data?.data ?? []).filter((filament) => {
    const matchesSearch = [
      filament.colour,
      filament.material,
      filament.manufacturer,
      filament.product_name,
      filament.variant_name,
    ].some((value) => value?.toLowerCase().includes(search.toLowerCase()))
    return (
      matchesSearch &&
      (stockFilter !== "local" || (filament.spools ?? 0) > 0) &&
      (stockFilter !== "eu" || filament.supplier_availability === "InStock")
    )
  })

  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        mb={6}
        gap={4}
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
      >
        <Heading size="lg">Filament Inventory</Heading>
        <Flex gap={2} wrap="wrap">
          <Button
            as={Link}
            to="/suadmin"
            variant="ghost"
            leftIcon={<ArrowBackIcon />}
          >
            Admin
          </Button>
          <ImportFilamentsButton />
          <Button
            variant="primary"
            leftIcon={<AddIcon />}
            onClick={() => openModal(null)}
          >
            Add Filament
          </Button>
        </Flex>
      </Flex>

      <Text mb={4} color="gray.500">
        Bambu Lab EU availability and local UBDM stock are tracked separately.
        Each refill or spool option has its own local quantity. Supplier stock
        reflects the last successful refresh.
      </Text>
      <Flex gap={3} mb={6} direction={{ base: "column", sm: "row" }}>
        <Input
          aria-label="Search filament"
          placeholder="Search colour, material or manufacturer"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          aria-label="Filter stock"
          maxW={{ sm: "250px" }}
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
        >
          <option value="all">All filament</option>
          <option value="local">In stock at UBDM</option>
          <option value="eu">In stock at Bambu EU</option>
        </Select>
      </Flex>

      {isError ? (
        <Box role="alert">
          <Text>Could not load filament inventory.</Text>
          <Button onClick={() => refetch()} mt={2}>
            Retry
          </Button>
        </Box>
      ) : isPending ? (
        <SkeletonText noOfLines={6} spacing={4} />
      ) : filaments.length === 0 ? (
        <Text color="gray.500">
          {data?.count
            ? "No filament matches these filters."
            : "No filament yet. Import Bambu EU stock or add filament manually."}
        </Text>
      ) : (
        <TableContainer>
          <Table size={{ base: "sm", md: "md" }}>
            <Thead>
              <Tr>
                <Th>Filament</Th>
                <Th>Bambu EU stock</Th>
                <Th>Local UBDM stock</Th>
                <Th isNumeric>Price (EUR)</Th>
                <Th>Details</Th>
                <Th width="1%" />
                <Th width="1%" />
              </Tr>
            </Thead>
            <Tbody>
              {filaments.map((filament) => {
                const spools = filament.spools ?? 0
                return (
                  <Tr key={filament.id}>
                    <Td>
                      <HStack>
                        <Box
                          w="20px"
                          h="20px"
                          flexShrink={0}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                          bg={filament.colour_hex ?? "transparent"}
                        />
                        <Box whiteSpace="normal" minW="150px">
                          <Text fontWeight="semibold">{filament.colour}</Text>
                          <Text fontSize="sm">
                            {filament.manufacturer} ·{" "}
                            {filament.product_name ?? filament.material}
                          </Text>
                          {filament.variant_name && (
                            <Text fontSize="sm" color="gray.500">
                              {filament.variant_name}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      {filament.supplier_availability ? (
                        <Box>
                          <Badge
                            colorScheme={
                              filament.supplier_availability === "InStock"
                                ? "green"
                                : ["OutOfStock", "SoldOut"].includes(
                                      filament.supplier_availability,
                                    )
                                  ? "red"
                                  : "gray"
                            }
                          >
                            {availabilityLabels[
                              filament.supplier_availability
                            ] ?? "Unknown"}
                          </Badge>
                          {filament.supplier_checked_at && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Checked{" "}
                              {new Date(
                                filament.supplier_checked_at,
                              ).toLocaleString()}
                            </Text>
                          )}
                        </Box>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Not linked
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <VStack align="start" spacing={2}>
                        <Badge colorScheme={spools > 0 ? "green" : "gray"}>
                          {spools > 0
                            ? `${spools} spools at UBDM`
                            : "Not in stock locally"}
                        </Badge>
                        <Button
                          size="xs"
                          onClick={() => adjustSpools(filament, 1)}
                          isDisabled={spoolsMutation.isPending}
                        >
                          Add 1 locally
                        </Button>
                        <HStack spacing={1}>
                          <Button
                            size="xs"
                            aria-label={`Use half a spool of ${
                              filament.colour
                            } ${filament.variant_name ?? ""}`}
                            onClick={() => adjustSpools(filament, -0.5)}
                            isDisabled={spools <= 0 || spoolsMutation.isPending}
                          >
                            −0.5
                          </Button>
                          <Button
                            size="xs"
                            aria-label={`Add half a spool of ${
                              filament.colour
                            } ${filament.variant_name ?? ""}`}
                            onClick={() => adjustSpools(filament, 0.5)}
                            isDisabled={spoolsMutation.isPending}
                          >
                            +0.5
                          </Button>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td isNumeric>
                      {filament.price != null
                        ? `€${filament.price.toFixed(2)}`
                        : "—"}
                      {filament.purchase_url ? (
                        <ChakraLink
                          display="block"
                          href={filament.purchase_url}
                          isExternal
                          fontSize="sm"
                          color="blue.500"
                        >
                          Buy {filament.supplier_sku ? "from EU" : ""}
                        </ChakraLink>
                      ) : null}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetails(filament)}
                      >
                        Details
                      </Button>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Edit filament"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openModal(filament)}
                      />
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Delete filament"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(filament)}
                      />
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Drawer
        isOpen={details !== null}
        onClose={() => setDetails(null)}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filament details — {details?.colour}</DrawerHeader>
          <DrawerBody>
            {details && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text>
                    {details.manufacturer} ·{" "}
                    {details.product_name ?? details.material}
                  </Text>
                  {details.variant_name && <Text>{details.variant_name}</Text>}
                  <Text>Local UBDM stock: {details.spools ?? 0} spools</Text>
                  {details.supplier_sku && (
                    <Text>EU variant ID: {details.supplier_sku}</Text>
                  )}
                  {details.supplier_checked_at && (
                    <Text>
                      Last checked:{" "}
                      {new Date(details.supplier_checked_at).toLocaleString()}
                    </Text>
                  )}
                </Box>
                {details.supplier_data ? (
                  <>
                    <Heading size="sm">Supplier details (EU)</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Full product and variant data from the last successful
                      import.
                    </Text>
                    <Box
                      as="pre"
                      fontSize="xs"
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      whiteSpace="pre-wrap"
                      overflowWrap="anywhere"
                    >
                      {JSON.stringify(details.supplier_data, null, 2)}
                    </Box>
                  </>
                ) : (
                  <Text color="gray.500">
                    This filament was added manually.
                  </Text>
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <FilamentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalFilament(null)
        }}
        filament={modalFilament}
      />
    </Container>
  )
}
