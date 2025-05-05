import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { FiLogOut, FiMenu } from "react-icons/fi"

import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import SidebarItems from "./SidebarItems"
import LogInOut from "./LogInOut"
import colors from "../../theme/colors";

const Sidebar = () => {
  const queryClient = useQueryClient()
  const textColor = useColorModeValue(colors.ui.dark, colors.ui.light);
  const secBgColor = useColorModeValue(colors.ui.light, colors.ui.dark);
  const secBgHover = useColorModeValue(colors.ui.hoverLight, colors.ui.hoverDark);
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Mobile */}
      <IconButton
        onClick={onOpen}
        display={{ base: "flex", md: "none" }}
        aria-label="Open Menu"
        position="absolute"
        fontSize="20px"
        m={4}
        icon={<FiMenu />}
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="250px">
          <DrawerCloseButton />
          <DrawerBody py={8}>
            <Flex flexDir="column" justify="space-between">
              <Box>
                <SidebarItems onClose={onClose} />
                <Flex
                  as="button"
                  onClick={handleLogout}
                  p={2}
                  color="ui.danger"
                  fontWeight="bold"
                  alignItems="center"
                  _hover={{ bg: secBgHover }}
                >
                  <FiLogOut />
                  <Text ml={2}>Log out</Text>
                </Flex>
              </Box>
              {currentUser?.email && (
                <Flex
                  p={2}
                  bg={secBgColor}
                  _hover={{ bg: secBgHover }}
                >
                  <Text color={textColor} noOfLines={2} fontSize="sm">
                    Logged in as: {currentUser.email}
                  </Text>
                </Flex>
              )}
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop */}
      <Flex
        flexDir="row"
        justify="space-between"
        align="center"
        bg={secBgColor}
        p={4}
        w="100%"
        padding={0}
        position="fixed"
        top="0"
      >
        <Flex justify="center">
          <SidebarItems />
          <LogInOut />
        </Flex>

        <Flex align="center" gap={2}>
          {currentUser?.email && (
            <Flex
              p={2}
              bg={secBgColor}
            >
              <Text color={textColor} noOfLines={1}>
                Logged in as: {currentUser.email}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </>
  )
}

export default Sidebar
