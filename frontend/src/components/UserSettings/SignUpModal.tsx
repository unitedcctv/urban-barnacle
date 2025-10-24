import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react"
import SignUp from "./signup.tsx"

interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
  openLogin?: () => void
}

/**
 * Displays the existing SignUp form inside a Chakra UI modal.
 * Re-uses the SignUp component so there is no duplication of logic.
 */
const SignUpModal = ({ isOpen, onClose, openLogin }: SignUpModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
    <ModalOverlay />
    <ModalContent>
      <ModalCloseButton />
      <ModalBody p={0}>
        {/* SignUp already contains its own padding / layout */}
        <SignUp onClose={onClose} openLogin={openLogin} />
      </ModalBody>
    </ModalContent>
  </Modal>
)

export default SignUpModal
