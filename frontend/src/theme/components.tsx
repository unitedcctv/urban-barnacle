
import disabledStyles from "./disabled-styles";

const components = {
  Button: {
    variants: {
      primary: {
        backgroundColor: "ui.main",
        color: "ui.light",
        _hover: {
          backgroundColor: "#00766C",
        },
        _disabled: {
          ...disabledStyles,
          _hover: {
            ...disabledStyles,
          },
        },
      },
      danger: {
        backgroundColor: "ui.danger",
        color: "ui.light",
        _hover: {
          backgroundColor: "#E32727",
        },
      },
    },
  },
  Tabs: {
    variants: {
      enclosed: {
        tab: {
          _selected: {
            color: "ui.main",
          },
        },
      },
    },
  },
};

export default components;
  