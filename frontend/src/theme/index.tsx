import { extendTheme } from "@chakra-ui/react"
import colors from "./colors"
import components from "./components"
import styles from "./custom-styles"
import disabledStyles from "./disabled-styles"
import fonts from "./fonts"

const theme = extendTheme({
  colors,
  disabledStyles,
  styles,
  components,
  fonts,
})

export default theme
