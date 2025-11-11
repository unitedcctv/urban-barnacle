const customStyles = {
  global: {
    ".grid-container": {
      display: "flex",
      flexWrap: "wrap",
      gap: "16px",
      justifyContent: "center",
    },
    ".grid-item": {
      flex: "0 0 280px",
      width: "280px",
      height: "453px",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      textAlign: "left",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
      _hover: {
        transform: "translateY(-5px)",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
      },
    },
    ".grid-item-image": {
      height: "67%",
      width: "100%",
      overflow: "hidden",
      backgroundColor: "#f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    ".grid-item-content": {
      height: "33%",
      backgroundColor: "white",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    "@media (max-width: 1024px)": {
      ".grid-item": {
        flex: "0 0 240px",
        width: "240px",
        height: "388px",
      },
    },
    "@media (max-width: 768px)": {
      ".grid-item": {
        flex: "0 0 220px",
        width: "220px",
        height: "356px",
      },
    },
    "@media (max-width: 480px)": {
      ".grid-item": {
        flex: "0 0 280px",
        width: "280px",
        height: "453px",
        maxWidth: "90%",
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
