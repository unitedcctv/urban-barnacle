import { Tr, Td, Badge, Flex, Box, Text, Icon } from "@chakra-ui/react"
import { UserPublic } from "../../client/types.gen"
import Delete from "../Common/DeleteAlert"
import EditUser from "../Admin/EditUser"
import { useDisclosure } from "@chakra-ui/react"
import { FiEdit, FiCrosshair } from "react-icons/fi"

type UserRowProps = {
  user: UserPublic
  currentUserId?: string
}

export function UserRow({ user, currentUserId }: UserRowProps) {
  const deleteModal = useDisclosure()
  const editUserModal = useDisclosure()

  return (
    <Tr>
      <Td
        color={!user.full_name ? "ui.dim" : "inherit"}
        isTruncated
        maxWidth="150px"
      >
        {user.full_name || "N/A"}
        {currentUserId === user.id && (
          <Badge ml="1" colorScheme="teal">
            You
          </Badge>
        )}
      </Td>
      <Td isTruncated maxWidth="150px">
        {user.email}
      </Td>
      <Td>{user.is_superuser ? "Superuser" : "User"}</Td>
      <Td>
        <Flex gap={2}>
          <Box
            w="2"
            h="2"
            borderRadius="50%"
            bg={user.is_active ? "ui.success" : "ui.danger"}
            alignSelf="center"
          />
        </Flex>
      </Td>
      <Td>
        <Text
          onClick={deleteModal.onOpen}
          cursor="pointer"
          color="red.500"
        >
          <Icon as={FiCrosshair} alignSelf="center" />
        </Text>
      </Td>
      <Td>
      <Box
          onClick={editUserModal.onOpen}
          cursor="pointer"
        >
          <Icon as={FiEdit} alignSelf="center" />
        </Box>
      </Td>

      <EditUser
          user={user as UserPublic}
          isOpen={editUserModal.isOpen}
          onClose={editUserModal.onClose}
        />
      <Delete
        type="User"
        id={user.id}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
      />
    </Tr>
  )
}
