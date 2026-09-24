import {
  Box,
  Button,
  Checkbox,
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
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { todosCreateTodo, todosUpdateTodo } from "../../client/sdk.gen"
import type { TodoCreate, TodoPublic, TodoUpdate } from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import LoadingLogo from "../Common/LoadingLogo"

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  todos: TodoPublic[]
  todo: TodoPublic | null
}

interface TodoForm {
  title: string
  description: string
  deadline: string
  related_ids: string[]
}

const toFormValues = (todo: TodoPublic | null): TodoForm => ({
  title: todo?.title ?? "",
  description: todo?.description ?? "",
  deadline: todo?.deadline ? todo.deadline.slice(0, 16) : "",
  related_ids: todo?.related_ids ?? [],
})

const TodoModal = ({ isOpen, onClose, todos, todo }: TodoModalProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const isEdit = todo !== null
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TodoForm>({
    mode: "onBlur",
    defaultValues: toFormValues(todo),
  })

  useEffect(() => {
    if (isOpen) {
      reset(toFormValues(todo))
    }
  }, [isOpen, todo, reset])

  const mutation = useMutation({
    mutationFn: (data: TodoCreate | TodoUpdate) =>
      isEdit
        ? todosUpdateTodo({
            path: { id: todo.id },
            body: data as TodoUpdate,
            throwOnError: true,
          })
        : todosCreateTodo({ body: data as TodoCreate, throwOnError: true }),
    onSuccess: () => {
      showToast(
        "Success!",
        `Todo ${isEdit ? "updated" : "created"} successfully.`,
        "success",
      )
      onClose()
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const onSubmit: SubmitHandler<TodoForm> = (data) => {
    mutation.mutate({
      title: data.title,
      description: data.description || null,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      related_ids: data.related_ids,
    })
  }

  const selectableTodos = todos.filter((t) => t.id !== todo?.id)

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
        <ModalHeader>{isEdit ? "Edit Todo" : "Add Todo"}</ModalHeader>
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
          <FormControl isRequired isInvalid={!!errors.title}>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input
              id="title"
              {...register("title", { required: "Title is required" })}
              placeholder="Title"
              type="text"
              isDisabled={isSubmitting}
            />
            {errors.title && (
              <FormErrorMessage>{errors.title.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.description}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description"
              isDisabled={isSubmitting}
            />
            {errors.description && (
              <FormErrorMessage>{errors.description.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl mt={4} isInvalid={!!errors.deadline}>
            <FormLabel htmlFor="deadline">Deadline</FormLabel>
            <Input
              id="deadline"
              {...register("deadline")}
              type="datetime-local"
              isDisabled={isSubmitting}
            />
            {errors.deadline && (
              <FormErrorMessage>{errors.deadline.message}</FormErrorMessage>
            )}
          </FormControl>
          {selectableTodos.length > 0 && (
            <FormControl mt={4}>
              <FormLabel>Related Todos</FormLabel>
              <VStack align="start" spacing={1}>
                {selectableTodos.map((other) => (
                  <Checkbox
                    key={other.id}
                    value={other.id}
                    {...register("related_ids")}
                    isDisabled={isSubmitting}
                  >
                    {other.title}
                  </Checkbox>
                ))}
              </VStack>
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isEdit ? "Save" : "Create Todo"}
          </Button>
          <Button onClick={onClose} isDisabled={isSubmitting}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default TodoModal
