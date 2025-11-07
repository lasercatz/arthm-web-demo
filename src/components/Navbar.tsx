"use client";

import { Box, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { Nunito } from "next/font/google";
import { useEffect, useState } from "react";

const nunito = Nunito({
  weight: ["500","600"],
  subsets: ["latin"],
});

export default function Navbar() {
     const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50); // threshold in px
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <Box sx={{}}>
      <Stack
        direction="row"
        alignItems="center"
        p="1em 1em"
        sx={{
          position: "fixed",
           zIndex: 1000,
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(255, 255, 255, 0)",

          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(10px)",

          width: "100%",
        }}
      >
        <Stack direction="row" gap={2} alignItems="center">
          {" "}
          <Box sx={{ width: "2.4em", height: "2.4em", position: "relative" }}>
            <Image
              src="/logos/arthm-logo.svg"
              alt="Arthm logo"
              fill={true}
              priority
              style={{
                  filter: scrolled ? "none" : "brightness(0) invert(1)", 
              }}
            />
          </Box>
          <Box
            sx={{
              fontFamily: nunito.style.fontFamily,
              fontSize: "1.5em",
              fontWeight: "600",
            }}
          >
            Arthm
          </Box>{" "}
        </Stack>
      </Stack>
    </Box>
  );
}
