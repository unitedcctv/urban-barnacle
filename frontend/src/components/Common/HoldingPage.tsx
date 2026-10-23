import { ArrowDownIcon } from "@chakra-ui/icons"
import {
  Flex,
  IconButton,
  Image,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import selectionImage from "../../theme/assets/selection.png"
import UBLogo from "../../theme/assets/ubdm.svg"

interface HoldingPageProps {
  onExplore?: () => void
}

export default function HoldingPage({ onExplore }: HoldingPageProps) {
  const background = useColorModeValue("ui.light", "ui.dark")
  const foreground = useColorModeValue("ui.dark", "ui.light")
  const logoFilter = useColorModeValue("none", "invert(1)")

  return (
    <Flex
      as="section"
      aria-label="Welcome"
      w="100%"
      h={{ base: "100dvh", sm: "100vh" }}
      direction="column"
      align="center"
      justify="center"
      position="relative"
      bg={background}
      color={foreground}
      px={6}
      pt={{ base: "24px", sm: "76px" }}
      pb="144px"
      gap={{ base: 2, sm: 3 }}
      sx={{ "@media (max-height: 500px)": { gap: 1 } }}
    >
      <Image
        src={UBLogo}
        alt="Urban Barnacle logo"
        // Scale with viewport width while clamping to reasonable min/max
        w="min(800px, 100%)"
        h="auto"
        maxH="100%"
        minH={0}
        objectFit="contain"
        filter={logoFilter}
      />
      <Text
        textAlign="center"
        fontSize={{ base: "md", sm: "xl" }}
        lineHeight="1.4"
        flexShrink={0}
        sx={{ "@media (max-height: 500px)": { fontSize: "14px" } }}
      >
        Made in Berlin
        <br />
        Customised for you
      </Text>
      <Image
        src={selectionImage}
        alt="A selection of colourful customised stools"
        w="min(1200px, 100%)"
        h="auto"
        maxH="18dvh"
        objectFit="contain"
        flexShrink={0}
        sx={{ "@media (max-height: 500px)": { maxHeight: "12dvh" } }}
      />
      {onExplore && (
        <IconButton
          aria-label="Scroll to explore"
          onClick={onExplore}
          variant="ghost"
          color="inherit"
          position="absolute"
          bottom="72px"
          boxSize="64px"
          borderRadius="full"
          icon={<ArrowDownIcon aria-hidden boxSize={10} />}
        />
      )}
    </Flex>
  )
}
