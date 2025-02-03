import { extendTheme } from "@chakra-ui/react";
import colors from "./colors";
import components from "./components";
import styles from "./custom-styles";
import disabledStyles from "./disabled-styles"; 

const theme = extendTheme({
  colors,
  disabledStyles,
  styles,
  components,
});

export default theme;
