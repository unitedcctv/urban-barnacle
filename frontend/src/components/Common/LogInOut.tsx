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
  } from "@chakra-ui/react";
  import { FiLogOut, FiLogIn } from "react-icons/fi";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import type { UserPublic } from "../../client";
  import Login from "./login";
  import useAuth from "../../hooks/useAuth";
  
  async function fetchCurrentUser(): Promise<UserPublic | null> {
    const response = await fetch("/api/currentUser");
    if (!response.ok) return null;
    return response.json();
  }
  
  const LogInOut = () => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const queryClient = useQueryClient();
    const { logout } = useAuth();
    const { data: currentUser } = useQuery<UserPublic | null>({
      queryKey: ["currentUser"],
      queryFn: fetchCurrentUser
    });
  
    const handleLogout = async () => {
      await logout();
      queryClient.setQueryData(["currentUser"], null);
    };
  
    return (
      <>
        {currentUser?.is_active ? (
          <Flex p={2} onClick={handleLogout} align="center" cursor="pointer">
            <Icon as={FiLogOut} alignSelf="center" />
            <Text ml={2}>Logout</Text>
          </Flex>
        ) : (
          <Flex onClick={onOpen} p={2} align="center">
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
    );
  };
  
  export default LogInOut;