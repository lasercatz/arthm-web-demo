"use client";

import React, { ReactNode, useMemo } from "react";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

export default function ThemeProvider({
  children,
  fontFamily,
}: {
  children: ReactNode;
  fontFamily?: string;
}) {
  const theme = useMemo(() => {
    const baseTheme = createTheme();

    return createTheme({
      ...baseTheme,
      typography: {
        fontFamily: fontFamily ? `${fontFamily}, sans-serif` : "sans-serif",
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              fontFamily: fontFamily ? `${fontFamily}, sans-serif` : "sans-serif",
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: ".5em",
              boxShadow: "0 0 1em 0 rgba(0, 0, 0, 0.1)",
            },
            list: {
              outline: "none",
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: "1em",
              boxShadow: "0 0 1em 0 rgba(0, 0, 0, 0.1)",
              [baseTheme.breakpoints.down("sm")]: {
                borderRadius: 0,
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: ".5em",
              textTransform: "none",
            },
          },
        },
      },
    });
  }, [fontFamily]);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
