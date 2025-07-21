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
  useDisclosure,
  Icon,
  Flex as ChakraFlex,
  useColorModeValue,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { FiLogOut, FiMenu } from "react-icons/fi"

import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import SidebarItems from "./SidebarItems"
import LogInOut from "./LogInOut"
import { useState } from "react";
import colors from "../../theme/colors";
import { Link } from "@tanstack/react-router";
import type { ElementType } from "react";
import UBLogoSvg from "../../theme/assets/UB.svg";

const Sidebar = () => {
  const logoColor = useColorModeValue(colors.ui.dark, colors.ui.light);
  const UBLogo = () =>
    typeof UBLogoSvg === "string" ? (
      <img src={UBLogoSvg} alt="Urban Barnacle" style={{ width: "52px", height: "52px", padding: "4px" }} />
    ) : (
      <Icon as={UBLogoSvg as unknown as ElementType} boxSize={10} color={logoColor} />
    );
  const queryClient = useQueryClient()
  const textColor = useColorModeValue(colors.ui.dark, colors.ui.light);
  const secBgColor = useColorModeValue(colors.ui.light, colors.ui.dark);
  const secBgHover = useColorModeValue(colors.ui.hoverLight, colors.ui.hoverDark);
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logout } = useAuth()

  // Track number of sidebar items to decide alignment
  const [itemCount, setItemCount] = useState(0);

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
                <ChakraFlex as={Link} to="/" align="center" mb={4} _hover={{ textDecoration: "none" }} onClick={onClose}>
                  <UBLogo />
                  <Text ml={2} fontWeight="200" color={textColor} whiteSpace="nowrap" noOfLines={1}>Urban Barnacle</Text>
                </ChakraFlex> 
                <SidebarItems onClose={onClose} onCount={setItemCount} />
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
        h="60px"
        w="100%"
        padding={0}
        position="fixed"
        top="0"
      >
        <ChakraFlex as={Link} to="/" align="center" _hover={{ textDecoration: "none" }}>
          <UBLogo />
          <Text ml={3} fontWeight="200" color={textColor} whiteSpace="nowrap" noOfLines={1}>Urban Barnacle</Text>
        </ChakraFlex>
        <Flex flex={itemCount <= 1 ? "1" : "unset"} justify={itemCount <= 1 ? "center" :"flex-start"} gap={4} ml={itemCount <= 1 ? 8 : 0}>
          <SidebarItems onCount={setItemCount} />
        </Flex>

        <Flex align="center" gap={2}>
          {currentUser?.email && (
            <Flex
              p={2}
              bg={secBgColor}
            >
              <Text color={textColor} noOfLines={1}>
                {currentUser.full_name}
              </Text>
            </Flex>
          )}
          <LogInOut />
        </Flex>
      </Flex>
    </>
  )
}

export default Sidebar
