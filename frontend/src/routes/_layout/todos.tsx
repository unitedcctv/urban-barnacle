import {
  AddIcon,
  ArrowBackIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
} from "@chakra-ui/icons"
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  IconButton,
  SkeletonText,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

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

import {
  todosDeleteTodo,
  todosReadTodos,
  todosReorderTodos,
} from "../../client/sdk.gen"
import type { TodoPublic } from "../../client/types.gen"
import TodoModal from "../../components/Admin/TodoModal"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

export const Route = createFileRoute("/_layout/todos")({
  component: TodosPage,
})

interface SortableTodoRowProps {
  todo: TodoPublic
  todos: TodoPublic[]
  onEdit: (todo: TodoPublic) => void
  onDelete: (todo: TodoPublic) => void
}

function formatDeadline(deadline?: string | null): string | null {
  if (!deadline) return null
  const date = new Date(deadline)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString()
}

function SortableTodoRow({
  todo,
  todos,
  onEdit,
  onDelete,
}: SortableTodoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const relatedTitles = (todo.related_ids ?? [])
    .map((id) => todos.find((t) => t.id === id)?.title)
    .filter((title): title is string => !!title)
  const deadline = formatDeadline(todo.deadline)
  const isOverdue = !!todo.deadline && new Date(todo.deadline) < new Date()

  return (
    <Flex
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
      align="center"
      gap={3}
      p={4}
      borderWidth="1px"
      borderRadius="md"
      bg="white"
      zIndex={isDragging ? 1 : undefined}
      position="relative"
    >
      <IconButton
        aria-label="Drag to reorder"
        icon={<DragHandleIcon />}
        variant="ghost"
        cursor="grab"
        {...attributes}
        {...listeners}
      />
      <Box flex="1" minW={0}>
        <Text fontWeight="bold" noOfLines={1}>
          {todo.title}
        </Text>
        {todo.description && (
          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {todo.description}
          </Text>
        )}
        <HStack mt={1} spacing={2} flexWrap="wrap">
          {deadline && (
            <Badge colorScheme={isOverdue ? "red" : "blue"}>
              Due: {deadline}
            </Badge>
          )}
          {relatedTitles.map((title) => (
            <Badge key={title} colorScheme="purple">
              {title}
            </Badge>
          ))}
        </HStack>
      </Box>
      <IconButton
        aria-label="Edit todo"
        icon={<EditIcon />}
        variant="ghost"
        onClick={() => onEdit(todo)}
      />
      <IconButton
        aria-label="Delete todo"
        icon={<DeleteIcon />}
        variant="ghost"
        colorScheme="red"
        onClick={() => onDelete(todo)}
      />
    </Flex>
  )
}

function TodosPage() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [modalTodo, setModalTodo] = useState<TodoPublic | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, isPending } = useQuery({
    queryKey: ["todos"],
    queryFn: () => todosReadTodos({ throwOnError: true }),
  })
  const todos = data?.data ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const reorderMutation = useMutation({
    mutationFn: (ordered: TodoPublic[]) =>
      todosReorderTodos({
        body: { ordered_ids: ordered.map((todo) => todo.id) },
        throwOnError: true,
      }),
    onMutate: (ordered) => {
      queryClient.setQueryData(["todos"], {
        data: ordered,
        count: ordered.length,
      })
    },
    onSuccess: (reordered) => {
      queryClient.setQueryData(["todos"], reordered)
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (todo: TodoPublic) =>
      todosDeleteTodo({ path: { id: todo.id }, throwOnError: true }),
    onSuccess: () => {
      showToast("Success!", "Todo deleted successfully.", "success")
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = todos.findIndex((todo) => todo.id === active.id)
    const newIndex = todos.findIndex((todo) => todo.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderMutation.mutate(arrayMove(todos, oldIndex, newIndex))
  }

  const openModal = (todo: TodoPublic | null) => {
    setModalTodo(todo)
    setIsModalOpen(true)
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Flex
        mb={6}
        gap={4}
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
      >
        <Heading size="lg">Todos</Heading>
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
            Add Todo
          </Button>
        </HStack>
      </Flex>
      {isPending ? (
        <VStack align="stretch" spacing={3}>
          {new Array(3).fill(null).map((_, index) => (
            <Box key={index} p={4} borderWidth="1px" borderRadius="md">
              <SkeletonText noOfLines={1} />
            </Box>
          ))}
        </VStack>
      ) : todos.length === 0 ? (
        <Text color="gray.500">No todos yet. Create your first todo.</Text>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos.map((todo) => todo.id)}
            strategy={verticalListSortingStrategy}
          >
            <VStack align="stretch" spacing={3}>
              {todos.map((todo) => (
                <SortableTodoRow
                  key={todo.id}
                  todo={todo}
                  todos={todos}
                  onEdit={openModal}
                  onDelete={(t) => deleteMutation.mutate(t)}
                />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>
      )}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        todos={todos}
        todo={modalTodo}
      />
    </Container>
  )
}

export default TodosPage
