import {
  Box,
  Flex as ChakraFlex,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import logoutIcon from "../../theme/assets/icons/logout.svg"
import menuIcon from "../../theme/assets/icons/menu.svg"

import { Link } from "@tanstack/react-router"
import { useState } from "react"
import type { ElementType } from "react"
import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import UBLogoSvg from "../../theme/assets/logo.svg"
import colors from "../../theme/colors"
import LogInOut from "./LogInOut"
import NavigationItems from "./NavigationItems"

const Navigation = () => {
  const logoColor = useColorModeValue(colors.ui.dark, colors.ui.light)
  const UBLogo = () =>
    typeof UBLogoSvg === "string" ? (
      <img
        src={UBLogoSvg}
        alt="Urban Barnacle"
        style={{ width: "52px", height: "52px", padding: "4px" }}
      />
    ) : (
      <Icon
        as={UBLogoSvg as unknown as ElementType}
        boxSize={16}
        color={logoColor}
      />
    )
  const queryClient = useQueryClient()
  const textColor = useColorModeValue(colors.ui.dark, colors.ui.light)
  const secBgColor = useColorModeValue(colors.ui.light, colors.ui.dark)
  const secBgHover = useColorModeValue(
    colors.ui.hoverLight,
    colors.ui.hoverDark,
  )
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logout } = useAuth()

  // Track number of navigation items to decide alignment
  const [itemCount, setItemCount] = useState(0)

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
        icon={
          <Icon
            as={menuIcon as unknown as ElementType}
            boxSize={16}
            color={logoColor}
          />
        }
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="250px">
          <DrawerCloseButton />
          <DrawerBody py={8}>
            <Flex flexDir="column" justify="space-between">
              <Box>
                <ChakraFlex
                  as={Link}
                  to="/"
                  align="center"
                  mb={4}
                  p={2}
                  _hover={{ textDecoration: "none", bg: secBgHover }}
                  onClick={onClose}
                >
                  <UBLogo />
                  <Text
                    ml={2}
                    fontWeight="200"
                    color={textColor}
                    whiteSpace="nowrap"
                    noOfLines={1}
                  >
                    Urban Barnacle
                  </Text>
                </ChakraFlex>
                <NavigationItems onClose={onClose} onCount={setItemCount} />
                <Flex
                  as="button"
                  onClick={handleLogout}
                  p={2}
                  color="ui.danger"
                  alignItems="center"
                  _hover={{ bg: secBgHover }}
                >
                  <img
                    src={logoutIcon}
                    alt="Logout"
                    style={{
                      width: "20px",
                      height: "20px",
                      opacity: "0.6",
                      transition: "opacity 0.2s",
                      filter:
                        "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = "0.6")
                    }
                  />
                  <Text ml={2}>Log out</Text>
                </Flex>
              </Box>
              {currentUser?.email && (
                <Flex p={2} bg={secBgColor} _hover={{ bg: secBgHover }}>
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
        h="52px"
        w="100%"
        padding={0}
        position="fixed"
        top="0"
      >
        <ChakraFlex
          as={Link}
          to="/"
          align="center"
          h="100%"
          px={2}
          _hover={{ textDecoration: "none", bg: secBgHover }}
        >
          <UBLogo />
          <Text ml={3} fontWeight="200" noOfLines={1}>
            UBDM
          </Text>
        </ChakraFlex>
        <Flex
          flex={itemCount <= 1 ? "1" : "unset"}
          justify={itemCount <= 1 ? "center" : "flex-start"}
          gap={4}
          ml={itemCount <= 1 ? 8 : 0}
        >
          <NavigationItems onCount={setItemCount} />
        </Flex>

        <Flex align="center" gap={2}>
          {currentUser?.email && (
            <Flex p={2} bg={secBgColor}>
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

export default Navigation
