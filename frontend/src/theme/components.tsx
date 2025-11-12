import disabledStyles from "./disabled-styles"

const components = {
  Heading: {
    baseStyle: {
      fontWeight: "400",
    },
  },
  Modal: {
    baseStyle: {
      header: {
        fontWeight: "400",
      },
    },
  },
  Button: {
    variants: {
      primary: {
        backgroundColor: "ui.main",
        color: "ui.light",
        _hover: {
          // Replaced the teal color with a darker gray shade
          backgroundColor: "ui.darkSlate",
        },
        _disabled: {
          ...disabledStyles,
          _hover: { ...disabledStyles },
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
  Radio: {
    baseStyle: {
      control: {
        _checked: {
          bg: "ui.main",
          borderColor: "ui.main",
          color: "ui.light", // color of the checkmark
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: "md",
      px: 2,
      py: 1,
      textTransform: "uppercase",
      fontSize: "sm",
      fontWeight: "normal",
    },
    variants: {
      solid: {
        bg: "ui.main",
        color: "ui.light",
      },
      subtle: {
        bg: "ui.light",
        color: "ui.main",
      },
      outline: {
        color: "ui.main",
        borderColor: "ui.main",
      },
    },
  },
}

export default components
