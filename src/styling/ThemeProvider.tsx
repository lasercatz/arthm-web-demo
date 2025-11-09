"use client";

import React, { ReactNode, useMemo } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from "@mui/material";

export default function ThemeProvider({
  children,
  fontFamily,
}: {
  children: ReactNode;
  fontFamily?: string;
}) {
  // create theme on client; memoize so it doesn't recreate each render
  const theme = useMemo(
    () =>
      createTheme({
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
              },
            },
          },
        },
      }),
    [fontFamily]
  );

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
