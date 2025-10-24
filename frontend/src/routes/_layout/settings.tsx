import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import Appearance from "../../components/UserSettings/Appearance"
import ChangePassword from "../../components/UserSettings/ChangePassword"
import UserInformation from "../../components/UserSettings/UserInformation"
import passwordIcon from "../../theme/assets/icons/password.svg"

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="flex-start" w="full">
        {/* Main Settings Grid */}
        <Flex
          gap={8}
          direction={{ base: "column", lg: "row" }}
          align="flex-start"
          w="full"
        >
          {/* Left Column - User Information */}
          <Box flex={1}>
            <UserInformation />
            <Button
              variant="primary"
              onClick={onOpen}
              leftIcon={
                <img
                  src={passwordIcon}
                  alt="password"
                  style={{
                    width: "20px",
                    height: "20px",
                    opacity: "0.6",
                    transition: "opacity 0.2s",
                    filter:
                      "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                />
              }
              mt={4}
            >
              Change Password
            </Button>
          </Box>

          {/* Right Column - Appearance & Security */}
          <VStack spacing={6} flex={1} align="stretch">
            {/* Appearance Section */}
            <Box>
              <Appearance />
            </Box>

            <Divider />
          </VStack>
        </Flex>
      </VStack>

      {/* Change Password Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <ChangePassword />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
