import { Box, Flex, Image, Spinner, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEffect, useState } from "react"
import { itemsReadItems, itemsUpdateItemOrder } from "../../client/sdk.gen"
import type { ItemPublic } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

const MAX_ITEMS = 100

const ItemOrderSection = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  const { data, isPending } = useQuery({
    queryKey: ["items", "admin-order", MAX_ITEMS],
    queryFn: () =>
      itemsReadItems({
        query: { skip: 0, limit: MAX_ITEMS },
        throwOnError: true,
      }),
  })

  const [items, setItems] = useState<ItemPublic[]>([])
  useEffect(() => {
    setItems(data?.data ?? [])
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const reorderMutation = useMutation({
    mutationFn: (item_ids: string[]) =>
      itemsUpdateItemOrder({
        body: { item_ids },
        throwOnError: true,
      }),
    onSuccess: () => {
      showToast("Success!", "Item order updated.", "success")
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    const newArray = arrayMove(items, oldIndex, newIndex)
    setItems(newArray)
    reorderMutation.mutate(newArray.map((item) => item.id))
  }

  if (isPending) {
    return (
      <Flex mt={4}>
        <Spinner size="lg" />
      </Flex>
    )
  }

  if (items.length === 0) {
    return (
      <Text mt={4} color="gray.500">
        No items yet.
      </Text>
    )
  }

  return (
    <Box mt={6}>
      <Text fontSize="sm" color="green.500" mb={2}>
        Drag to reorder how items appear on the home page and gallery
      </Text>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <VStack align="stretch" spacing={2}>
            {items.map((item) => (
              <SortableItemRow key={item.id} item={item} />
            ))}
          </VStack>
        </SortableContext>
      </DndContext>
    </Box>
  )
}

export default ItemOrderSection

const SortableItemRow = ({ item }: { item: ItemPublic }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      align="center"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={2}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
    >
      {item.image_urls && item.image_urls.length > 0 && (
        <Image
          src={item.image_urls[0]}
          alt={item.title}
          maxH="60px"
          borderRadius="md"
          mr={3}
        />
      )}
      <Box>
        <Text fontWeight="bold">{item.title}</Text>
        <Text fontSize="sm" color="gray.500">
          {item.is_sold ? "Sold" : `€${item.price}`}
        </Text>
      </Box>
    </Flex>
  )
}
