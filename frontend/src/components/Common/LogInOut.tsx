import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import React from "react"
import type { UserPublic } from "../../client"
import useAuth, { isLoggedIn } from "../../hooks/useAuth"
import loginIcon from "../../theme/assets/icons/login.svg"
import logoutIcon from "../../theme/assets/icons/logout.svg"
import SignUpModal from "../UserSettings/SignUpModal.tsx"
import Login from "./Login.tsx"

async function fetchCurrentUser(): Promise<UserPublic | null> {
  const apiBase = import.meta.env.VITE_API_URL ?? ""
  const response = await fetch(`${apiBase}/api/currentUser`)
  if (!response.ok) return null
  return response.json()
}

interface LogInOutProps {
  showText?: boolean
}

const LogInOut = ({ showText = true }: LogInOutProps) => {
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

  const bgHover = useColorModeValue("#EDF2F7", "#4A5568")

  const mouseHandlers = (
    e: React.MouseEvent<HTMLDivElement>,
    entering: boolean,
    action?: "down" | "up",
  ) => {
    const img = e.currentTarget.querySelector("img")
    if (!img) return

    if (action === "down") {
      img.style.transform = "scale(1.05)"
    } else if (action === "up") {
      img.style.transform = "scale(1.15)"
    } else if (entering) {
      img.style.opacity = "1"
      img.style.transform = "scale(1.15)"
      img.style.filter =
        "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)"
    } else {
      img.style.opacity = "0.6"
      img.style.transform = "scale(1)"
      img.style.filter = "brightness(0) saturate(0%) invert(60%)"
    }
  }

  return (
    <>
      {currentUser?.is_active ? (
        <Tooltip label={currentUser.full_name || currentUser.email} placement="bottom">
          <Flex
            pl={0}
            pr={4}
            py={0}
            h="52px"
            onClick={handleLogout}
            align="center"
            cursor="pointer"
            _hover={{ bg: bgHover }}
            onMouseEnter={(e) => mouseHandlers(e, true)}
            onMouseLeave={(e) => mouseHandlers(e, false)}
            onMouseDown={(e) => mouseHandlers(e, true, "down")}
            onMouseUp={(e) => mouseHandlers(e, true, "up")}
          >
            <img
              src={logoutIcon}
              alt="Logout"
              style={{
                width: "20px",
                height: "20px",
                opacity: "0.6",
                transition: "all 0.2s ease",
                filter: "brightness(0) saturate(0%) invert(60%)",
                pointerEvents: "none",
              }}
            />
            {showText && <Text ml={2}>Logout</Text>}
          </Flex>
        </Tooltip>
      ) : (
        <Flex
          pl={0}
          pr={4}
          py={0}
          h="52px"
          onClick={onOpen}
          align="center"
          cursor="pointer"
          _hover={{ bg: bgHover }}
          onMouseEnter={(e) => mouseHandlers(e, true)}
          onMouseLeave={(e) => mouseHandlers(e, false)}
          onMouseDown={(e) => mouseHandlers(e, true, "down")}
          onMouseUp={(e) => mouseHandlers(e, true, "up")}
        >
          <img
            src={loginIcon}
            alt="Login"
            style={{
              width: "20px",
              height: "20px",
              opacity: "0.6",
              transition: "all 0.2s ease",
              filter: "brightness(0) saturate(0%) invert(60%)",
              pointerEvents: "none",
            }}
          />
          {showText && <Text ml={2}>Login</Text>}
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

      <SignUpModal
        isOpen={signUp.isOpen}
        onClose={signUp.onClose}
        openLogin={onOpen}
      />
    </>
  )
}

export default LogInOut
