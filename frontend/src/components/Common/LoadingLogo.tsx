import { Box, keyframes } from "@chakra-ui/react"
import LogoSvg from "../../theme/assets/logo.svg"

interface LoadingLogoProps {
  size?: string
}

const blurAnimation = keyframes`
  0% {
    filter: blur(20px);
  }
  100% {
    filter: blur(0px);
  }
`

const LoadingLogo = ({ size = "120px" }: LoadingLogoProps) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <Box
        as="img"
        src={LogoSvg}
        alt="Loading..."
        width={size}
        height={size}
        animation={`${blurAnimation} 5s ease-out infinite`}
      />
    </Box>
  )
}

export default LoadingLogo
