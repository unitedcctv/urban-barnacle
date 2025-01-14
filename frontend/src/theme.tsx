import { extendTheme } from "@chakra-ui/react"

const disabledStyles = {
  _disabled: {
    backgroundColor: "ui.main",
  },
}

const theme = extendTheme({
  colors: {
    ui: {
      main: "#009688",
      secondary: "#EDF2F7",
      success: "#48BB78",
      danger: "#E53E3E",
      light: "#FAFAFA",
      dark: "#1A202C",
      darkSlate: "#252D3D",
      dim: "#A0AEC0",
    },
  },
  components: {
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
    
  },
  styles: {
    global: {
      ".grid-container": {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        justifyContent: "center",
      },
      ".grid-item": {
        flex: "1 1 calc(20% - 16px)",
        maxWidth: "calc(20% - 16px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        overflow: "hidden",
        padding: "16px",
        transition: "transform 0.2s",
        _hover: {
          transform: "translateY(-5px)",
        },
      },
      "@media (max-width: 1024px)": {
        ".grid-item": {
          flex: "1 1 calc(33.333% - 16px)",
          maxWidth: "calc(33.333% - 16px)",
        },
      },
      "@media (max-width: 768px)": {
        ".grid-item": {
          flex: "1 1 calc(50% - 16px)",
          maxWidth: "calc(50% - 16px)",
        },
      },
      "@media (max-width: 480px)": {
        ".grid-item": {
          flex: "1 1 100%",
          maxWidth: "100%",
        },
      },
    },
  },
});

export default theme
