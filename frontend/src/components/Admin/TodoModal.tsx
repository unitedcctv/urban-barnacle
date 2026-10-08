import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { todosCreateTodo, todosUpdateTodo } from "../../client/sdk.gen"
import type {
  TodoCreate,
  TodoPublic,
  TodoRelation,
  TodoRelationType,
  TodoUpdate,
} from "../../client/types.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import LoadingLogo from "../Common/LoadingLogo"

export const TODO_RELATION_LABELS: Record<TodoRelationType, string> = {
  depends_on: "Depends on",
  required_by: "Required by",
  blocking: "Blocking",
  blocked_by: "Blocked by",
  parent: "Parent",
  child: "Child task",
  linked: "Linked",
}

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
  related: TodoRelation[]
}

const toFormValues = (todo: TodoPublic | null): TodoForm => ({
  title: todo?.title ?? "",
  description: todo?.description ?? "",
  deadline: todo?.deadline ? todo.deadline.slice(0, 16) : "",
  related: todo?.related ?? [],
})

const TodoModal = ({ isOpen, onClose, todos, todo }: TodoModalProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const isEdit = todo !== null
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TodoForm>({
    mode: "onBlur",
    defaultValues: toFormValues(todo),
  })

  const related = watch("related") ?? []
  const relatedIds = related.map((rel) => rel.id)

  useEffect(() => {
    if (isOpen) {
      reset(toFormValues(todo))
    }
  }, [isOpen, todo, reset])

  const toggleRelated = (id: string) => {
    const current = watch("related") ?? []
    setValue(
      "related",
      current.some((rel) => rel.id === id)
        ? current.filter((rel) => rel.id !== id)
        : [...current, { id, relation: "linked" as TodoRelationType }],
    )
  }

  const setRelatedIds = (ids: string[]) => {
    const current = watch("related") ?? []
    setValue(
      "related",
      ids.map(
        (id) =>
          current.find((rel) => rel.id === id) ?? { id, relation: "linked" },
      ),
    )
  }

  const setRelationType = (id: string, relation: TodoRelationType) => {
    const current = watch("related") ?? []
    setValue(
      "related",
      current.map((rel) => (rel.id === id ? { ...rel, relation } : rel)),
    )
  }

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
      related: data.related,
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
              {selectableTodos.length > 3 ? (
                <Menu closeOnSelect={false}>
                  <MenuButton
                    as={Button}
                    w="100%"
                    variant="outline"
                    isDisabled={isSubmitting}
                  >
                    {relatedIds.length > 0
                      ? `${relatedIds.length} related`
                      : "Select related todos"}
                  </MenuButton>
                  <MenuList maxH="240px" overflowY="auto">
                    <MenuOptionGroup
                      type="checkbox"
                      value={relatedIds}
                      onChange={(value) =>
                        setRelatedIds(Array.isArray(value) ? value : [value])
                      }
                    >
                      {selectableTodos.map((other) => (
                        <MenuItemOption key={other.id} value={other.id}>
                          {other.title}
                        </MenuItemOption>
                      ))}
                    </MenuOptionGroup>
                  </MenuList>
                </Menu>
              ) : (
                <VStack align="start" spacing={1}>
                  {selectableTodos.map((other) => (
                    <Checkbox
                      key={other.id}
                      isChecked={relatedIds.includes(other.id)}
                      onChange={() => toggleRelated(other.id)}
                      isDisabled={isSubmitting}
                    >
                      {other.title}
                    </Checkbox>
                  ))}
                </VStack>
              )}
              {related.length > 0 && (
                <VStack align="stretch" spacing={2} mt={3}>
                  {related.map((rel) => (
                    <HStack key={rel.id} spacing={3}>
                      <Text flex={1} fontSize="sm" noOfLines={1}>
                        {todos.find((t) => t.id === rel.id)?.title ?? rel.id}
                      </Text>
                      <Select
                        size="sm"
                        w="48%"
                        value={rel.relation ?? "linked"}
                        isDisabled={isSubmitting}
                        onChange={(e) =>
                          setRelationType(
                            rel.id,
                            e.target.value as TodoRelationType,
                          )
                        }
                      >
                        {(
                          Object.entries(TODO_RELATION_LABELS) as [
                            TodoRelationType,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </HStack>
                  ))}
                </VStack>
              )}
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
