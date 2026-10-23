import { ChevronDownIcon } from "@chakra-ui/icons"
import { Button, Flex, Image, useColorModeValue } from "@chakra-ui/react"
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
    >
      <Image
        src={UBLogo}
        alt="Urban Barnacle logo"
        mb={4}
        // Scale with viewport width while clamping to reasonable min/max
        w="min(800px, 100%)"
        h="auto"
        maxH="100%"
        minH={0}
        objectFit="contain"
        filter={logoFilter}
      />
      {onExplore && (
        <Button
          onClick={onExplore}
          variant="ghost"
          color="inherit"
          position="absolute"
          bottom="72px"
          rightIcon={<ChevronDownIcon aria-hidden boxSize={6} />}
        >
          Scroll to explore
        </Button>
      )}
    </Flex>
  )
}
