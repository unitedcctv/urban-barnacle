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
import { useNavigate } from "@tanstack/react-router"
import type { UserPublic } from "../../client"
import Login from "./login"
import SignUpModal from "../UserSettings/SignUpModal.tsx"
import useAuth, { isLoggedIn } from "../../hooks/useAuth"

async function fetchCurrentUser(): Promise<UserPublic | null> {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  const response = await fetch(`${apiBase}/api/currentUser`)
  if (!response.ok) return null
  return response.json()
}

const LogInOut = () => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const signUp = useDisclosure()
  const queryClient = useQueryClient()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const authenticated = isLoggedIn()

  // If you need the user data for display (e.g., to show "Logout" vs "Login"):
  const { data: currentUser } = useQuery<UserPublic | null>({
    enabled: authenticated,
    queryFn: fetchCurrentUser,
    queryKey: ["currentUser"],
  })

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
    // Redirect to home page
    navigate({ to: "/" })
  }

  return (
    <>
      {currentUser?.is_active ? (
        <Flex p={2} onClick={handleLogout} align="center" cursor="pointer">
          <Text>Logout</Text>
          <Icon ml={2} as={FiLogOut} alignSelf="center" />
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
            <Login onClose={onClose} openSignUp={signUp.onOpen} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <SignUpModal isOpen={signUp.isOpen} onClose={signUp.onClose} openLogin={onOpen} />
    </>
  )
}

export default LogInOut
