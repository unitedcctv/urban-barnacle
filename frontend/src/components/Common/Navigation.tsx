import {
  Flex as ChakraFlex,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react"
import leftPanelCloseIcon from "../../theme/assets/icons/left_panel_close.svg"
import leftPanelOpenIcon from "../../theme/assets/icons/left_panel_open.svg"

import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import UBLogoSvg from "../../theme/assets/logo.svg"
import colors from "../../theme/colors"
import LogInOut from "./LogInOut"
import NavigationItems from "./NavigationItems"

const Navigation = () => {
  const UBLogo = () =>
      <img
        src={UBLogoSvg}
        alt="Urban Barnacle"
        style={{ width: "52px", height: "52px", padding: "4px" }}
      />
  const textColor = useColorModeValue(colors.ui.dark, colors.ui.light)
  const secBgColor = useColorModeValue(colors.ui.light, colors.ui.dark)
  const secBgHover = useColorModeValue(
    colors.ui.hoverLight,
    colors.ui.hoverDark,
  )
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Track number of navigation items to decide alignment
  const [itemCount, setItemCount] = useState(0)

  // Calculate breakpoint based on item count
  // Estimate: logo ~150px, each nav item with text ~120px, login/logout ~100px, padding ~50px
  const minWidthForText = useMemo(() => {
    const logoWidth = 150
    const itemWidthWithText = 120
    const loginWidth = 100
    const padding = 50
    return logoWidth + (itemCount * itemWidthWithText) + loginWidth + padding
  }, [itemCount])

  const [showText] = useMediaQuery(`(min-width: ${minWidthForText}px)`)

  return (
    <>
      {/* Phone - Drawer */}
      <IconButton
        onClick={onOpen}
        display={{ base: "flex", sm: "none" }}
        aria-label="Open Menu"
        position="absolute"
        fontSize="20px"
        m={4}
        icon={
          <img
            src={leftPanelOpenIcon}
            alt="Open Menu"
            style={{ width: "32px", height: "32px" }}
          />
        }
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="120px">
          <IconButton
            aria-label="Close Menu"
            position="absolute"
            right={2}
            top={2}
            size="sm"
            variant="ghost"
            bg="transparent"
            _hover={{ bg: "transparent" }}
            onClick={onClose}
            icon={
              <img
                src={leftPanelCloseIcon}
                alt="Close Menu"
                style={{ width: "24px", height: "24px" }}
              />
            }
          />
          <DrawerBody py={4}>
            <Flex flexDir="column" align="center">
              <ChakraFlex
                as={Link}
                to="/"
                flexDir="column"
                align="center"
                mb={4}
                p={2}
                _hover={{ textDecoration: "none", bg: secBgHover }}
                onClick={onClose}
              >
                <img
                  src={UBLogoSvg}
                  alt="Urban Barnacle"
                  style={{ width: "80px", height: "80px" }}
                />
                <Text
                  mt={1}
                  fontWeight="300"
                  color={textColor}
                  whiteSpace="nowrap"
                >
                  UBDM
                </Text>
              </ChakraFlex>
              <NavigationItems onClose={onClose} onCount={setItemCount} direction="column" />
              <LogInOut showText={true} />
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Tablet & Desktop - Top Navigation */}
      <Flex
        display={{ base: "none", sm: "flex" }}
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
          <Text ml={3} fontWeight="300" noOfLines={1}>
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

        <LogInOut showText={showText} />
      </Flex>
    </>
  )
}

export default Navigation
