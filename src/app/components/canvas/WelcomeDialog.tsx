"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  DialogContent,
  Stack,
} from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function WelcomeDialog({ open, onClose }: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    
    >
      <DialogTitle>{"How to use?"}</DialogTitle>

      <DialogContent>
        <Stack direction="column" gap={2}>
          <Typography fontStyle="italic">
            This is a static site demo. There are no live
            functionalities.
          </Typography>
          <Typography>
            Currently, Arthm can generate drawing plans and paint reference images. Turn-based interaction and text-guided drawing are not supported.
            Start by selecting a reference image:{" "}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: theme.palette.text.secondary,
                transform: "translateY(.3em)",
              }}
            >
              {" "}
              <MoreHorizRoundedIcon />&nbsp;&nbsp;
              {">"}&nbsp;&nbsp;Select reference image
            </span>
            .
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
