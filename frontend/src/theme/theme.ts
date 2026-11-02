"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#83834B",
      light: "#A8A658",
      dark: "#504624",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D9AF3F",
      dark: "#BA9327",
      contrastText: "#1A1A1A",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#5F5F55",
    },
    divider: "#E5E5DD",
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: {
      fontFamily: '"Cormorant Garamond", serif',
      fontWeight: 600,
      letterSpacing: "-0.035em",
      lineHeight: 0.98,
    },
    h2: {
      fontFamily: '"Cormorant Garamond", serif',
      fontWeight: 600,
      letterSpacing: "-0.025em",
      lineHeight: 1.05,
    },
    h3: {
      fontFamily: '"Cormorant Garamond", serif',
      fontWeight: 600,
      lineHeight: 1.12,
    },
    h4: {
      fontFamily: '"Cormorant Garamond", serif',
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h5: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
    },
    button: {
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: "smooth",
        },
        body: {
          minWidth: 320,
        },
        "::selection": {
          backgroundColor: "#D9AF3F",
          color: "#1A1A1A",
        },
        "a:focus-visible, button:focus-visible": {
          outline: "3px solid #BA9327",
          outlineOffset: "3px",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            scrollBehavior: "auto !important",
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 46,
          paddingInline: 22,
          borderRadius: 3,
        },
      },
    },
  },
});

export default theme;
