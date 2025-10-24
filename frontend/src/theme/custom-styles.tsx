const customStyles = {
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
    form: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
  },
}

export default customStyles
