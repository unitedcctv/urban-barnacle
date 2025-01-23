import { Tr, Td, Badge, Flex, Box, Button, Icon, Text } from "@chakra-ui/react"
import { UserPublic } from "../../client/types.gen"
import Delete from "../Common/DeleteAlert"
import EditUser from "../Admin/EditUser"
import { useDisclosure } from "@chakra-ui/react"
import { FiEdit } from "react-icons/fi"

type UserRowProps = {
  user: UserPublic
  currentUserId?: string
}

export function UserRow({ user, currentUserId }: UserRowProps) {
  const deleteModal = useDisclosure()
  const editUserModal = useDisclosure()

  const renderPermissions = (permissions: string | null | undefined) => {
    if (!permissions) return <Text color="gray.500">No permissions</Text>
  
    const permissionArray = permissions.split(",") // Split the string into an array
  
    return (
      <Flex gap={2} wrap="wrap">
        {permissionArray.map((permission) => (
          <Box
            key={permission}
            bg="orange.500"
            color="white"
            px={3}
            py={1}
            borderRadius="20px"
            fontSize="sm"
            fontWeight="medium"
          >
            {permission}
          </Box>
        ))}
      </Flex>
    )
  }

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
      <Td>{renderPermissions(user.permissions)}</Td>
      <Td>
        <Flex justify={"center"}>
          <Box
            w="2"
            h="2"
            borderRadius="50%"
            bg={user.is_active ? "ui.success" : "ui.danger"}
          />
        </Flex>
      </Td>
      <Td>
        <Button
          onClick={deleteModal.onOpen}
          cursor="pointer"
          color="red.400"
          borderRadius="50%"
          h={12}
          w={12}
        >
          X
        </Button>
      </Td>
      <Td>
      <Button
          onClick={editUserModal.onOpen}
          cursor="pointer"
          borderRadius="50%"
          h={12}
        >
          <Icon as={FiEdit} alignSelf="center" />
        </Button>
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
