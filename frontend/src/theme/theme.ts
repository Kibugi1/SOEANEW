"use client";

import { createTheme } from "@mui/material/styles";

/**
 * SOEA design tokens: the single source of truth for colours, fonts and
 * component defaults. Components should read these through the theme
 * (e.g. `color: "primary.main"`, `bgcolor: "background.subtle"`,
 * `<Typography variant="eyebrow">`) rather than hardcoding values.
 * `globals.css` holds only browser resets and must not define tokens.
 */

declare module "@mui/material/styles" {
  interface TypeBackground {
    /** Warm off-white used for alternating section bands. */
    subtle: string;
    /** Deep earth tone used for dark, inverted sections. */
    inverse: string;
  }

  interface TypographyVariants {
    eyebrow: React.CSSProperties;
    lead: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    eyebrow?: React.CSSProperties;
    lead?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    eyebrow: true;
    lead: true;
  }
}

// Default MUI breakpoints (xs 0, sm 600, md 900, lg 1200, xl 1536), used
// below for responsive type sizes.
const { breakpoints } = createTheme();

const fontFamilies = {
  display: '"Cormorant Garamond", serif',
  body: '"DM Sans", sans-serif',
  label: '"Space Mono", monospace',
};

/** Offset for in-page anchor jumps so headings clear the fixed navbar. */
const navbarScrollOffset = 90;

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
      subtle: "#F5F5EF",
      inverse: "#292719",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#5F5F55",
    },
    divider: "#E5E5DD",
  },
  typography: {
    fontFamily: fontFamilies.body,
    h1: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
      letterSpacing: "-0.035em",
      lineHeight: 0.98,
      fontSize: "3rem",
      [breakpoints.up("sm")]: { fontSize: "4rem" },
      [breakpoints.up("md")]: { fontSize: "5.5rem" },
    },
    h2: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
      letterSpacing: "-0.025em",
      lineHeight: 1.05,
      fontSize: "2.625rem",
      [breakpoints.up("md")]: { fontSize: "4rem" },
    },
    h3: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
      lineHeight: 1.12,
      fontSize: "1.75rem",
      [breakpoints.up("md")]: { fontSize: "2.25rem" },
    },
    h4: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
      lineHeight: 1.15,
    },
    h5: {
      fontFamily: fontFamilies.body,
      fontWeight: 600,
    },
    h6: {
      fontFamily: fontFamilies.body,
      fontWeight: 600,
    },
    button: {
      fontFamily: fontFamilies.body,
      fontWeight: 600,
      textTransform: "none",
    },
    eyebrow: {
      fontFamily: fontFamilies.label,
      fontSize: "0.7rem",
      fontWeight: 400,
      letterSpacing: "0.14em",
      lineHeight: 1.6,
      textTransform: "uppercase",
    },
    /** Introductory paragraph under a section heading. */
    lead: {
      fontFamily: fontFamilies.body,
      fontSize: "0.9375rem",
      lineHeight: 1.9,
      [breakpoints.up("md")]: { fontSize: "1.0625rem" },
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        html: {
          scrollBehavior: "smooth",
          scrollPaddingTop: navbarScrollOffset,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          minWidth: 320,
          minHeight: "100vh",
        },
        "::selection": {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.text.primary,
        },
        "a:focus-visible, button:focus-visible": {
          outline: `3px solid ${theme.palette.secondary.dark}`,
          outlineOffset: "3px",
        },
        "@media (prefers-reduced-motion: reduce)": {
          html: {
            scrollBehavior: "auto",
          },
          "*, *::before, *::after": {
            scrollBehavior: "auto !important",
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      }),
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          eyebrow: "p",
          lead: "p",
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
