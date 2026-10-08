import { AddIcon, ArrowBackIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Link as ChakraLink,
  Container,
  Flex,
  HStack,
  Heading,
  IconButton,
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
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import {
  filamentsDeleteFilament,
  filamentsReadFilaments,
  filamentsUpdateFilament,
} from "../../client/sdk.gen"
import type { FilamentPublic } from "../../client/types.gen"
import FilamentModal from "../../components/Admin/FilamentModal"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

export const Route = createFileRoute("/_layout/filament")({
  component: FilamentPage,
})

function FilamentPage() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [modalFilament, setModalFilament] = useState<FilamentPublic | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, isPending } = useQuery({
    queryKey: ["filaments"],
    queryFn: () => filamentsReadFilaments({ throwOnError: true }),
  })

  const spoolsMutation = useMutation({
    mutationFn: ({ id, spools }: { id: string; spools: number }) =>
      filamentsUpdateFilament({
        path: { id },
        body: { spools },
        throwOnError: true,
      }),
    onError: (err: unknown) => handleError(err, showToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["filaments"] })
    },
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
    const newCount = Math.max(
      0,
      Math.round(((filament.spools ?? 0) + delta) * 10) / 10,
    )
    spoolsMutation.mutate({ id: filament.id, spools: newCount })
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

  const filaments = data?.data ?? []

  return (
    <Container maxW="container.lg" py={8}>
      <Flex
        mb={6}
        gap={4}
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
      >
        <Heading size="lg">Filament Inventory</Heading>
        <HStack>
          <Button
            as={Link}
            to="/suadmin"
            variant="ghost"
            leftIcon={<ArrowBackIcon />}
          >
            Admin
          </Button>
          <Button
            variant="primary"
            leftIcon={<AddIcon />}
            onClick={() => openModal(null)}
          >
            Add Filament
          </Button>
        </HStack>
      </Flex>

      {isPending ? (
        <SkeletonText noOfLines={6} spacing={4} />
      ) : filaments.length === 0 ? (
        <Text color="gray.500">No filament in stock yet.</Text>
      ) : (
        <TableContainer>
          <Table size={{ base: "sm", md: "md" }}>
            <Thead>
              <Tr>
                <Th>Colour</Th>
                <Th>Material</Th>
                <Th>Spools</Th>
                <Th>Manufacturer</Th>
                <Th isNumeric>Price</Th>
                <Th>Link</Th>
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
                        <Text>{filament.colour}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge>{filament.material}</Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          onClick={() => adjustSpools(filament, -0.5)}
                          isDisabled={spools <= 0}
                        >
                          −
                        </Button>
                        <Text px={1} minW="32px" textAlign="center">
                          {spools % 1 === 0 ? spools : spools.toFixed(1)}
                        </Text>
                        <Button
                          size="xs"
                          onClick={() => adjustSpools(filament, 0.5)}
                        >
                          +
                        </Button>
                      </HStack>
                    </Td>
                    <Td>{filament.manufacturer}</Td>
                    <Td isNumeric>
                      {filament.price != null
                        ? `€${filament.price.toFixed(2)}`
                        : "—"}
                    </Td>
                    <Td>
                      {filament.purchase_url ? (
                        <ChakraLink
                          href={filament.purchase_url}
                          isExternal
                          fontSize="sm"
                          color="blue.500"
                        >
                          Buy
                        </ChakraLink>
                      ) : (
                        "—"
                      )}
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
