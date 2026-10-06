import {
  Box,
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
      {/* Slim grab-handle on the left edge of the screen; content keeps its
          normal position since the handle is only a few pixels wide */}
      <Box
        as="button"
        onClick={onOpen}
        display={{ base: "block", sm: "none" }}
        aria-label="Open Menu"
        position="fixed"
        left={0}
        top="50%"
        transform="translateY(-50%)"
        w="8px"
        h="120px"
        bg={colors.ui.main}
        borderRightRadius="lg"
        boxShadow="sm"
        cursor="pointer"
        zIndex={1000}
        _active={{ bg: colors.ui.darkSlate }}
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
        zIndex={1000}
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

        <Flex align="center">
          <LogInOut showText={showText} />
        </Flex>
      </Flex>
    </>
  )
}

export default Navigation
