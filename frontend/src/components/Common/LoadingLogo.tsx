import { Box } from "@chakra-ui/react"
import LogoSvg from "../../theme/assets/logo.svg"
import "./LoadingLogo.css"

interface LoadingLogoProps {
  size?: string
}

const LoadingLogo = ({ 
  size = "120px"
}: LoadingLogoProps) => {
  return (
    <Box className="loading-logo-container">
      <Box
        as="img"
        src={LogoSvg}
        alt="Loading..."
        width={size}
        height={size}
        className="loading-logo"
      />
    </Box>
  )
}

export default LoadingLogo
