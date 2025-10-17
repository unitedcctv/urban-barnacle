import {
  Container,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  VStack,
  Divider,
  Box,
  Icon,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { FiLock } from "react-icons/fi"
import UserInformation from "../../components/UserSettings/UserInformation"
import Appearance from "../../components/UserSettings/Appearance"
import ChangePassword from "../../components/UserSettings/ChangePassword"


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
                leftIcon={<Icon as={FiLock} />}
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
