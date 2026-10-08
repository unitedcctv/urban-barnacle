import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  filamentsCreateFilament,
  filamentsUpdateFilament,
} from "../../client/sdk.gen"
import type {
  FilamentCreate,
  FilamentMaterial,
  FilamentPublic,
  FilamentUpdate,
} from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import LoadingLogo from "../Common/LoadingLogo"

const MATERIALS: FilamentMaterial[] = [
  "PLA",
  "PETG",
  "ABS",
  "ASA",
  "TPU",
  "PC",
  "Nylon",
  "PVA",
  "Other",
]

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

interface FilamentModalProps {
  isOpen: boolean
  onClose: () => void
  filament: FilamentPublic | null
}

interface FilamentForm {
  colour: string
  colour_hex: string
  material: FilamentMaterial
  spools: number
  manufacturer: string
  price: string
  purchase_url: string
}

const toFormValues = (filament: FilamentPublic | null): FilamentForm => ({
  colour: filament?.colour ?? "",
  colour_hex: filament?.colour_hex ?? "",
  material: filament?.material ?? "PLA",
  spools: filament?.spools ?? 0,
  manufacturer: filament?.manufacturer ?? "",
  price: filament?.price != null ? String(filament.price) : "",
  purchase_url: filament?.purchase_url ?? "",
})

const FilamentModal = ({ isOpen, onClose, filament }: FilamentModalProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const isEdit = filament !== null
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FilamentForm>({
    mode: "onBlur",
    defaultValues: toFormValues(filament),
  })

  useEffect(() => {
    if (isOpen) {
      reset(toFormValues(filament))
    }
  }, [isOpen, filament, reset])

  const colourHexValue = watch("colour_hex")
  const swatchHex = HEX_PATTERN.test(colourHexValue ?? "")
    ? colourHexValue
    : undefined

  const mutation = useMutation({
    mutationFn: (data: FilamentCreate | FilamentUpdate) =>
      isEdit
        ? filamentsUpdateFilament({
            path: { id: filament.id },
            body: data as FilamentUpdate,
            throwOnError: true,
          })
        : filamentsCreateFilament({
            body: data as FilamentCreate,
            throwOnError: true,
          }),
    onSuccess: () => {
      showToast(
        "Success!",
        `Filament ${isEdit ? "updated" : "created"} successfully.`,
        "success",
      )
      onClose()
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["filaments"] })
    },
  })

  const onSubmit: SubmitHandler<FilamentForm> = (data) => {
    mutation.mutate({
      colour: data.colour,
      colour_hex: data.colour_hex || null,
      material: data.material,
      spools: data.spools,
      manufacturer: data.manufacturer,
      price: data.price !== "" ? Number(data.price) : null,
      purchase_url: data.purchase_url || null,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "sm", md: "md" }}
      isCentered
      closeOnOverlayClick={!isSubmitting}
    >
      <ModalOverlay />
      <ModalContent
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        position="relative"
      >
        <ModalHeader>{isEdit ? "Edit Filament" : "Add Filament"}</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        {isSubmitting && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(255, 255, 255, 0.9)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={10}
            borderRadius="md"
          >
            <LoadingLogo size="80px" />
          </Box>
        )}
        <ModalBody pb={6} w="100%">
          <FormControl isRequired isInvalid={!!errors.colour}>
            <FormLabel htmlFor="colour">Colour</FormLabel>
            <Input
              id="colour"
              {...register("colour", { required: "Colour is required" })}
              placeholder="Galaxy Blue"
              type="text"
              isDisabled={isSubmitting}
            />
            {errors.colour && (
              <FormErrorMessage>{errors.colour.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.colour_hex}>
            <FormLabel htmlFor="colour_hex">Hex Code</FormLabel>
            <Flex gap={2} align="center">
              <Input
                id="colour_hex"
                {...register("colour_hex", {
                  pattern: {
                    value: HEX_PATTERN,
                    message: "Must be a hex colour like #1E3A8A",
                  },
                })}
                placeholder="#1E3A8A"
                type="text"
                isDisabled={isSubmitting}
              />
              <Box
                w="36px"
                h="36px"
                flexShrink={0}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                bg={swatchHex ?? "transparent"}
              />
            </Flex>
            {errors.colour_hex && (
              <FormErrorMessage>{errors.colour_hex.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.material}>
            <FormLabel htmlFor="material">Material</FormLabel>
            <Select
              id="material"
              {...register("material")}
              isDisabled={isSubmitting}
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.spools}>
            <FormLabel htmlFor="spools">Spools</FormLabel>
            <Input
              id="spools"
              {...register("spools", {
                valueAsNumber: true,
                min: { value: 0, message: "Cannot be negative" },
              })}
              placeholder="1"
              type="number"
              step="0.5"
              min="0"
              isDisabled={isSubmitting}
            />
            {errors.spools && (
              <FormErrorMessage>{errors.spools.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isRequired isInvalid={!!errors.manufacturer}>
            <FormLabel htmlFor="manufacturer">Manufacturer</FormLabel>
            <Input
              id="manufacturer"
              {...register("manufacturer", {
                required: "Manufacturer is required",
              })}
              placeholder="Prusament"
              type="text"
              isDisabled={isSubmitting}
            />
            {errors.manufacturer && (
              <FormErrorMessage>{errors.manufacturer.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.price}>
            <FormLabel htmlFor="price">Price per Spool (€)</FormLabel>
            <Input
              id="price"
              {...register("price", {
                validate: (value) =>
                  value === "" ||
                  Number(value) >= 0 ||
                  "Price cannot be negative",
              })}
              placeholder="29.99"
              type="number"
              step="0.01"
              min="0"
              isDisabled={isSubmitting}
            />
            {errors.price && (
              <FormErrorMessage>{errors.price.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.purchase_url}>
            <FormLabel htmlFor="purchase_url">Purchase URL</FormLabel>
            <Input
              id="purchase_url"
              {...register("purchase_url")}
              placeholder="https://…"
              type="url"
              isDisabled={isSubmitting}
            />
            {errors.purchase_url && (
              <FormErrorMessage>{errors.purchase_url.message}</FormErrorMessage>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isEdit ? "Save" : "Add Filament"}
          </Button>
          <Button onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default FilamentModal
