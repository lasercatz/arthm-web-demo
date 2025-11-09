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
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Masonry from "@mui/lab/Masonry";
type Props = {
  open: boolean;
  onClose: () => void;
  /**
   * Called immediately when an image tile is clicked (selected).
   * Also called on Confirm if the same image is still selected.
   */
  onSelect?: (src: string | null) => void;
};

const RANDOM_IMG_URLS = [
  // small Unsplash images (for demo — you can replace with your own)
  "https://images.unsplash.com/photo-1762496991966-584520e6ff1a",
  "https://images.unsplash.com/photo-1761839257961-4dce65b72d99",
  "https://images.unsplash.com/photo-1760612393683-1b2cda6fdbbe",
  "https://images.unsplash.com/photo-1762216443831-e2b039de23a8",
  "https://images.unsplash.com/photo-1752328618119-8805f8a9ff19",
];

export default function ReferenceImageDialog({
  open,
  onClose,
  onSelect,
}: Props) {
  const theme = useTheme();

  // images state: index 0 is reserved for the upload placeholder / uploaded image
  const [images, setImages] = useState<string[]>(() => [
    "", // slot 0 (empty placeholder)
    ...RANDOM_IMG_URLS,
  ]);

  // selected index (-1 => none)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // store the object URL if user uploaded a local file (so we can revoke it later)
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);

  // hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // component unmount: revoke object URL if any
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
      }
    };
  }, [localObjectUrl]);

  // If dialog is reopened, you might want to reset selection (optional).
  // Here we keep selection while open; uncomment to reset on open:
  // useEffect(() => { if (open) setSelectedIndex(-1); }, [open]);

  const handlePlaceholderClick = () => {
    // trigger hidden file input
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // revoke previous local object URL
    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setLocalObjectUrl(objUrl);

    // replace first slot with uploaded image
    setImages((prev) => {
      const copy = [...prev];
      copy[0] = objUrl;
      return copy;
    });

    // automatically select the uploaded image
    setSelectedIndex(0);


    // clear input value so same file can be selected again if needed
    e.currentTarget.value = "";
  };

  // optional: remove uploaded image and restore placeholder
  const removeUploadedImage = () => {
    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
      setLocalObjectUrl(null);
    }
    setImages((prev) => {
      const copy = [...prev];
      copy[0] = "";
      return copy;
    });
    // if removed image was selected, clear selection
    setSelectedIndex((prev) => {
      if (prev === 0) {
        onSelect?.(null);
        return -1;
      }
      return prev;
    });
  };

  const handleTileClick = (idx: number, src: string) => {
    // if placeholder empty (idx 0 and no src) => open file picker
    if (idx === 0 && !src) {
      handlePlaceholderClick();
      return;
    }

    // select tile
    setSelectedIndex(idx);
  };

  const handleConfirm = () => {
    const src = selectedIndex >= 0 ? images[selectedIndex] || null : null;
    onSelect?.(src);
    onClose();
  };
 const fullScreen = useMediaQuery(theme.breakpoints.down("sm")); 
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >

        <DialogTitle>
          {"Select a picture to paint"}
        </DialogTitle>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {/* Masonry gallery */}
      <Box
        sx={{
          px: 3,
          py: 2,
 
          overflowY: "auto",
        }}
      >
        <Masonry columns={{ xs: 2, sm: 3, md: 3 }} spacing={2}>
          {images.map((src, idx) => {
            const isUploaded = Boolean(src);
            const isSelected = selectedIndex === idx;

            // common style for selected vs normal
            const tileSx = {
              width: "100%",
              display: "block",
              borderRadius: 2,
              overflow: "hidden",
              cursor: idx === 0 && !isUploaded ? "pointer" : "pointer",
            };

            if (idx === 0) {
              return (
                <Box
                  key={idx}
                  onClick={() => handleTileClick(idx, src)}
                  sx={{
                    ...tileSx,
                    p: isUploaded ? 0 : 3, // larger padding when placeholder
                    bgcolor: isUploaded ? "transparent" : "rgba(0,0,0,0.04)",
                    borderStyle: isUploaded ? "solid" : "dashed",
                    borderColor: isSelected
                      ? theme.palette.primary.main
                      : "rgba(0,0,0,0.14)",
                  }}
                >
                  {!isUploaded ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        textAlign
                          : "center",
                        gap: 1,
                        py: 4,
                      }}
                    >
                      <UploadFileRoundedIcon
                        sx={{ fontSize: 36, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Click to upload
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: "relative" }}>
                      <img
                        src={src}
                        alt="uploaded"
                        style={{
                          width: "100%",
                          display: "block",
                          borderRadius: 8,
                          pointerEvents: "none",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaceholderClick();
                          }}
                        >
                          <UploadFileRoundedIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage();
                          }}
                        >
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            }

            // regular image tile
            return (
              <Box
                key={idx}
                sx={tileSx}
                style={{
                      backgroundColor: isSelected
                      ? "#69e0fdff"
                      : "transparent",
                      padding:isSelected ? 6 : 0,

                      transition: "background-color 0.15s ease-in-out, padding 0.15s ease-in-out",
                }}
                onClick={() => handleTileClick(idx, src)}
              >
                <img
                  src={src}
                  alt={`ref-${idx}`}
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: 6,
                    pointerEvents: "none",
                    boxShadow: isSelected
                      ? "0 8px 28px rgba(0,0,0,0.18)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                 
                  }}
                />
              </Box>
            );
          })}
        </Masonry>
      </Box>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedIndex === -1}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
