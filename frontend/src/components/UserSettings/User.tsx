import { Badge, Box, Flex, Td, Text, Tr, useToast } from "@chakra-ui/react"
import { useDisclosure } from "@chakra-ui/react"
import { useState } from "react"
import type { ProducerPublic, UserPublic } from "../../client/types.gen"
import { producersReadProducerByUser } from "../../client/sdk.gen"
import deleteIcon from "../../theme/assets/icons/delete.svg"
import editIcon from "../../theme/assets/icons/edit.svg"
import EditUser from "../Admin/EditUser"
import EditProducer from "../Producers/EditProducer"
import Delete from "../Common/DeleteAlert"

type UserRowProps = {
  user: UserPublic
  currentUserId?: string
}

export function UserRow({ user, currentUserId }: UserRowProps) {
  const deleteModal = useDisclosure()
  const editUserModal = useDisclosure()
  const editProducerModal = useDisclosure()
  const [producer, setProducer] = useState<ProducerPublic | null>(null)
  const toast = useToast()

  const handleEditClick = async () => {
    // Check if user has producer permissions
    if (user.permissions?.includes("producer")) {
      try {
        const producerData = await producersReadProducerByUser({ userId: user.id })
        if (producerData) {
          setProducer(producerData)
          editProducerModal.onOpen()
        } else {
          toast({
            title: "No producer profile found",
            description: "This user doesn't have a producer profile yet.",
            status: "info",
            duration: 3000,
          })
          editUserModal.onOpen()
        }
      } catch (error) {
        console.error("Error fetching producer:", error)
        toast({
          title: "Error",
          description: "Failed to load producer profile.",
          status: "error",
          duration: 3000,
        })
        editUserModal.onOpen()
      }
    } else {
      editUserModal.onOpen()
    }
  }

  const renderPermissions = (permissions: string | null | undefined) => {
    if (!permissions) return <Text color="gray.500">No permissions</Text>

    const permissionArray = permissions.split(",") // Split the string into an array

    return (
      <Flex gap={2} wrap="wrap">
        {permissionArray.map((permission) => (
          <Box
            key={permission}
            bg="gray.500"
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
        <Flex cursor="pointer" onClick={deleteModal.onOpen} w="24px" h="24px">
          <img
            src={deleteIcon}
            alt="delete"
            className="hover-icon"
            style={{
              width: "24px",
              height: "24px",
              display: "block",
              opacity: "0.6",
              transition: "all 0.2s ease",
              filter:
                "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.transform = "scale(1.15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6"
              e.currentTarget.style.transform = "scale(1)"
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          />
        </Flex>
      </Td>
      <Td>
        <Flex cursor="pointer" onClick={handleEditClick} w="24px" h="24px">
          <img
            src={editIcon}
            alt="edit"
            className="hover-icon"
            style={{
              width: "24px",
              height: "24px",
              display: "block",
              opacity: "0.6",
              transition: "all 0.2s ease",
              filter: "brightness(0) saturate(0%) invert(60%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.transform = "scale(1.15)"
              e.currentTarget.style.filter =
                "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6"
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.filter =
                "brightness(0) saturate(0%) invert(60%)"
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          />
        </Flex>
      </Td>
      <Td>
        <EditUser
          user={user as UserPublic}
          isOpen={editUserModal.isOpen}
          onClose={editUserModal.onClose}
        />
        {producer && (
          <EditProducer
            producer={producer}
            isOpen={editProducerModal.isOpen}
            onClose={editProducerModal.onClose}
          />
        )}
        <Delete
          type="User"
          id={user.id}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
        />
      </Td>
    </Tr>
  )
}
