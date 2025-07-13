import React from "react"
import {
  Flex,
  Icon,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react"
import { FiLogOut, FiLogIn } from "react-icons/fi"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserPublic } from "../../client"
import Login from "./login"
import useAuth, { isLoggedIn } from "../../hooks/useAuth"

async function fetchCurrentUser(): Promise<UserPublic | null> {
  // Correct backend endpoint for current user
  const response = await fetch("/api/v1/users/me")
  if (!response.ok) return null
  return response.json()
}

const LogInOut = () => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const queryClient = useQueryClient()
  const { logout } = useAuth()

  // If you need the user data for display (e.g., to show "Logout" vs "Login"):
  const { data: currentUser } = useQuery<UserPublic | null>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
  })

  // Check if the user is logged in from your auth hook
  const authenticated = isLoggedIn()

  // Whenever the user becomes authenticated, close the modal
  React.useEffect(() => {
    if (authenticated) {
      onClose()
    }
  }, [authenticated, onClose])

  const handleLogout = async () => {
    logout()
    // Invalidate or reset the currentUser query so it reflects logged-out state
    queryClient.setQueryData(["currentUser"], null)
  }

  return (
    <>
      {currentUser?.is_active ? (
        <Flex p={2} onClick={handleLogout} align="center" cursor="pointer">
          <Icon as={FiLogOut} alignSelf="center" />
          <Text ml={2}>Logout</Text>
        </Flex>
      ) : (
        <Flex onClick={onOpen} p={2} align="center" cursor="pointer">
          <Icon as={FiLogIn} alignSelf="center" />
          <Text ml={2}>Login</Text>
        </Flex>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Login />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default LogInOut
