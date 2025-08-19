import { Flex, Image} from "@chakra-ui/react"
import UBLogo from "../../theme/assets/ubdm.svg"

export default function HoldingPage() {
  return (
    <Flex w="100%" h="80vh" direction="column" align="center" justify="center">
      <Image
        src={UBLogo}
        alt="Urban Barnacle logo"
        mb={4}
        // Scale with viewport width while clamping to reasonable min/max
        w="clamp(800px, 20vw, 100px)"
        h="auto"
      />
    </Flex>
  )
}
