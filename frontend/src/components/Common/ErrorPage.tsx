import { Flex, Text } from "@chakra-ui/react"

interface ErrorPageProps {
  message?: string
}

export default function ErrorPage({
  message = "Something went wrong.",
}: ErrorPageProps) {
  return (
    <Flex w="100%" h="80vh" direction="column" align="center" justify="center">
      <Text fontSize="3xl" mb={2}>
        Error
      </Text>
      <Text>{message}</Text>
    </Flex>
  )
}
