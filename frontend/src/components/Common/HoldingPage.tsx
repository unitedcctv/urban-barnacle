import { Flex, Image, Text } from "@chakra-ui/react"
import UBLogo from "../../theme/assets/UB.svg"

export default function HoldingPage() {
  return (
    <Flex w="100%" h="80vh" direction="column" align="center" justify="center">
      <Image src={UBLogo} alt="Urban Barnacle logo" boxSize="120px" mb={4} />
      <Text fontSize="4xl" fontWeight="bold">
        Urban Barnacle
      </Text>
    </Flex>
  )
}
