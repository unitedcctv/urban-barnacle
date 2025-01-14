import { extendTheme } from "@chakra-ui/react";
import colors from "./colors";
import components from "./components";
import customStyles from "./custom-styles";
import disabledStyles from "./disabled-styles";

const theme = extendTheme({
  colors,
  disabledStyles,
  customStyles,
  components,
});

export default theme;
