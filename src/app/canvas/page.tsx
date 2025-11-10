"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import styles from "./page.module.css";
import {
  Box,
  IconButton,
  Stack,
  Slider,
  TextField,
  Typography,
  Menu,
  MenuItem,
  Popover,
} from "@mui/material";
import { ChromePicker } from "react-color";
import ListSubheader from "@mui/material/ListSubheader";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { styled, useTheme } from "@mui/material/styles";
import { Nunito } from "next/font/google";

import WelcomeDialog from "../components/canvas/WelcomeDialog";
import ReferenceImageDialog from "../components/canvas/ReferenceImageDialog";
import { useRouter } from "next/navigation";

const nunito = Nunito({
  weight: ["500", "600"],
  subsets: ["latin"],
});
const StyledListHeader = styled(ListSubheader)({
  backgroundImage: "var(--Paper-overlay)",
});

type LineType = {
  points: number[];
  stroke: string;
  strokeWidth: number;
  lineCap: "round" | "butt" | "square";
  lineJoin: "round" | "bevel" | "miter";
  compositeOperation: CanvasRenderingContext2D["globalCompositeOperation"];
};

const DEFAULT_BRUSH = { color: "#000000", size: 4 };
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export function useImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = src;
    img.crossOrigin = "Anonymous";
    img.onload = () => setImage(img);
    return () => {
      setImage(null);
    };
  }, [src]);

  return [image] as const;
}

function BackgroundImage({
  src,
  stageWidth,
  stageHeight,
  opacity,
}: {
  src?: string;
  stageWidth: number;
  stageHeight: number;
  opacity: number; // 0..1
}) {
  const [image] = useImage(src || "");
  if (!src || !image) return null;

  const scale = Math.min(stageWidth / image.width, stageHeight / image.height);
  const imgW = image.width * scale;
  const imgH = image.height * scale;
  const x = (stageWidth - imgW) / 2;
  const y = (stageHeight - imgH) / 2;

  return (
    <KonvaImage
      image={image as any}
      x={x}
      y={y}
      width={imgW}
      height={imgH}
      opacity={opacity}
      listening={false} // don't intercept pointer events
    />
  );
}

export default function Page() {
  const router = useRouter();
  const theme = useTheme();
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const bgLayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [lines, setLines] = useState<LineType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH.color);
  const [brushSize, setBrushSize] = useState<number>(DEFAULT_BRUSH.size);

  // background opacity (0..1)
  const [bgOpacityPercent, setBgOpacityPercent] = useState<number>(80);
  const bgOpacity = Math.max(0, Math.min(100, bgOpacityPercent)) / 100;

  // transform (pan/zoom)
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  // whether the stage is draggable (we enable it only while panning)
  const [isStageDraggable, setIsStageDraggable] = useState(false);

  // track spacebar pressed (desktop panning)
  const [spacePressed, setSpacePressed] = useState(false);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // undo / clear
  const undo = () => setLines((l) => (l.length ? l.slice(0, l.length - 1) : l));
  const clearAll = () => setLines([]);

  // export
  const exportPNG = () => {
    if (!stageRef.current) return;

    const sanitizeFilename = (name: string) =>
      name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "untitled";

    const safeName = sanitizeFilename(artworkName);
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });

    const link = document.createElement("a");
    link.download = `${safeName}.png`;
    link.href = dataURL;
    link.click();
  };

  // helper: convert pointer to stage coordinates that account for current stage position and scale
  const getTransformedPointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const x = (pointer.x - stage.x()) / stage.scaleX();
    const y = (pointer.y - stage.y()) / stage.scaleY();
    return { x, y };
  }, []);

  // drawing handlers
  const handlePointerDown = (e: any) => {
    // ignore right-click
    if (e?.evt?.button === 2) return;

    // If stage is draggable (we're panning via spacebar or touch two-finger), don't start drawing
    if (isStageDraggable) return;

    const pos = getTransformedPointer();
    if (!pos) return;

    setIsDrawing(true);
    const newLine: LineType = {
      points: [pos.x, pos.y],
      stroke: brushColor,
      strokeWidth: brushSize,
      lineCap: "round",
      lineJoin: "round",
      compositeOperation:
        tool === "eraser"
          ? ("destination-out" as const)
          : ("source-over" as const),
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing) return;
    if (isStageDraggable) return;
    const pos = getTransformedPointer();
    if (!pos) return;
    setLines((prevLines) => {
      if (prevLines.length === 0) return prevLines;
      const lastIndex = prevLines.length - 1;
      const updated = prevLines.slice();
      const last = { ...updated[lastIndex] };
      last.points = last.points.concat([pos.x, pos.y]);
      updated[lastIndex] = last;
      return updated;
    });
  };
  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // wheel zoom centered (controlled)
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);

    // calculate new position so zoom is centered
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStagePos(newPos);
  };

  // dragging/panning
  const handleDragStart = () => {
    isPanningRef.current = true;
  };
  const handleDragEnd = (e: any) => {
    isPanningRef.current = false;
    setStagePos({ x: e.target.x(), y: e.target.y() });
  };

  // keyboard shortcuts incl. spacebar panning
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      // spacebar: start panning mode
      if (ev.code === "Space") {
        // prevent page scroll while space is held when focused on canvas
        ev.preventDefault();
        setSpacePressed(true);
        setIsStageDraggable(true);
      }

      if (ev.key === "e") setTool("eraser");
      if (ev.key === "b") setTool("brush");
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "z") undo();
      if (ev.key === "z" && !ev.ctrlKey && !ev.metaKey) undo();
      if (ev.key === "Escape") setIsDrawing(false);
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        setSpacePressed(false);
        setIsStageDraggable(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialStageScaleRef = useRef<number | null>(null);
  const pinchCenterStageRef = useRef<{ x: number; y: number } | null>(null);
  const lastMidpointPageRef = useRef<{ x: number; y: number } | null>(null);
  const initialStagePosRef = useRef<{ x: number; y: number } | null>(null);

  const getTouchDistance = (t1: Touch, t2: Touch) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchMidpoint = (t1: Touch, t2: Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  // Convert page/client coordinates to stage coordinates (taking stage position+scale into account)
  const pageToStage = (pageX: number, pageY: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.container().getBoundingClientRect();
    const x = (pageX - rect.left - stage.x()) / stage.scaleX();
    const y = (pageY - rect.top - stage.y()) / stage.scaleY();
    return { x, y, pageX, pageY, rectLeft: rect.left, rectTop: rect.top };
  };

  const MIN_PINCH_DISTANCE_CHANGE = 6; // px — threshold to decide pinch vs pan
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 8;

  const onTouchStart = (e: any) => {
    const touches: TouchList | undefined = e?.evt?.touches;
    if (!touches) return;

    if (touches.length === 2) {
      // initialize pinch/pan state
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = getTouchDistance(t1, t2);
      initialPinchDistanceRef.current = dist;

      const midpoint = getTouchMidpoint(t1, t2);
      // store midpoint in stage coords so we can keep that point fixed during scale
      const stageMid = pageToStage(midpoint.x, midpoint.y);
      pinchCenterStageRef.current = stageMid
        ? { x: stageMid.x, y: stageMid.y }
        : null;

      lastMidpointPageRef.current = { x: midpoint.x, y: midpoint.y };

      const stage = stageRef.current;
      initialStageScaleRef.current = stage ? stage.scaleX() : null;
      initialStagePosRef.current = stage
        ? { x: stage.x(), y: stage.y() }
        : null;

      // enter draggable mode for two-finger gestures
      isPanningRef.current = true;
      setIsStageDraggable(true);
    } else if (touches.length === 1) {
      // single finger: drawing (unless stage is draggable)
      if (isStageDraggable) return;
      // existing single-finger drawing code should handle pointerdown
    }
  };

  const onTouchMove = (e: any) => {
    const touches: TouchList | undefined = e?.evt?.touches;
    if (!touches) return;
    if (touches.length !== 2) return;

    // prevent page scroll while interacting
    e.evt.preventDefault();

    const t1 = touches[0];
    const t2 = touches[1];
    const newDist = getTouchDistance(t1, t2);
    const midpoint = getTouchMidpoint(t1, t2);

    const initDist = initialPinchDistanceRef.current;
    const initScale = initialStageScaleRef.current ?? 1;
    const pinchCenterStage = pinchCenterStageRef.current;
    const lastMid = lastMidpointPageRef.current;

    if (initDist == null || pinchCenterStage == null) {
      // safety: if we lost init values, bail
      return;
    }

    // Decide whether this movement is a pinch (scale) or a pan (move)
    const distDelta = Math.abs(newDist - initDist);

    if (distDelta >= MIN_PINCH_DISTANCE_CHANGE) {
      // PINCH / ZOOM
      const scaleFactor = newDist / initDist;
      let newScale = initScale * scaleFactor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      setStageScale(newScale);

      // Keep the pinch center anchored. Convert the current midpoint page coords
      // into stage coordinates *before* scaling -> compute new stage position.
      const stage = stageRef.current;
      if (!stage) return;

      // pointer page coords -> we have midpoint.x/midpoint.y
      // mousePointTo (in stage coords relative to old scale) = pinchCenterStage (we stored already)
      const mousePointTo = pinchCenterStage;

      // compute new top-left so that mousePointTo stays under midpoint on screen
      // stage.container bounding rect used to compute container offset (midpoint is page coords)
      const rect = stage.container().getBoundingClientRect();
      const newPos = {
        x: midpoint.x - rect.left - mousePointTo.x * newScale,
        y: midpoint.y - rect.top - mousePointTo.y * newScale,
      };

      setStagePos(newPos);
    } else {
      // TWO-FINGER PAN: move stage by delta of midpoint
      if (!lastMid) {
        lastMidpointPageRef.current = { x: midpoint.x, y: midpoint.y };
        return;
      }
      const dx = midpoint.x - lastMid.x;
      const dy = midpoint.y - lastMid.y;

      // update stage position by adding delta in page pixels
      // But stage.x/y are in page pixels already (since you set them that way earlier)
      // So we can apply dx,dy directly.
      setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));

      // update stored last midpoint
      lastMidpointPageRef.current = { x: midpoint.x, y: midpoint.y };
    }
  };

  const onTouchEnd = (e: any) => {
    const touches: TouchList | undefined = e?.evt?.touches;
    const count = touches ? touches.length : 0;

    // if no fingers left — fully end gesture
    if (count === 0) {
      isPanningRef.current = false;
      initialPinchDistanceRef.current = null;
      initialStageScaleRef.current = null;
      pinchCenterStageRef.current = null;
      lastMidpointPageRef.current = null;
      initialStagePosRef.current = null;
      if (!spacePressed) setIsStageDraggable(false);
    } else if (count === 1) {
      // If one remains, we might want to switch into single-finger drawing mode.
      // Clean up pinch state but keep stage draggable only if space is pressed or other flags
      initialPinchDistanceRef.current = null;
      initialStageScaleRef.current = null;
      pinchCenterStageRef.current = null;
      lastMidpointPageRef.current = null;
      initialStagePosRef.current = null;

      // keep draggable based on spacePressed
      if (!spacePressed) {
        setIsStageDraggable(false);
        isPanningRef.current = false;
      }
    }
  };

  useEffect(() => {
    const roTarget = containerRef.current;
    if (!roTarget) {
      return;
    }

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setStageSize({
        width: Math.max(10, Math.floor(rect.width)),
        height: Math.max(10, Math.floor(rect.height)),
      });
    });
    ro.observe(roTarget);
    const rect = roTarget.getBoundingClientRect();
    setStageSize({
      width: Math.max(10, Math.floor(rect.width)),
      height: Math.max(10, Math.floor(rect.height)),
    });

    return () => ro.disconnect();
  }, []);

  const brushCursorSVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm230-240L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Z"/></svg>
`);
  const eraserCursorSVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M690-240h190v80H610l80-80Zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160H190Z"/></svg>`);
  const [focused, setFocused] = useState(false);
  const [artworkName, setArtworkName] = useState("");
  const [moreOptonsAnchorEl, setMoreOptonsAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const open = Boolean(moreOptonsAnchorEl);
  const handleClose = () => {
    setMoreOptonsAnchorEl(null);
  };
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(true);
  const [refImageSelectDialogOpen, setRefImageSelectDialogOpen] =
    useState(false);
  const [chatboxOpen, setChatboxOpen] = useState(true);

  const [refImageSrc, setRefImageSrc] = useState<string>(
    "https://images.unsplash.com/photo-1760612393683-1b2cda6fdbbe"
  );
  const [colorSelectorOpen, setColorSelectorOpen] = useState(false);
  const leftToolbarAnchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Box className={styles.page}>
        <Stack
          className="fullscreen-interface"
          sx={{
            width: "100vw",
            height: "100dvh",
            position: "absolute",
          }}
        >
          {" "}
          <Stack
            direction="row"
            justifyContent={"space-between"}
            sx={{
              p: "1em 1em 1em 1em",
              zIndex: 1000,
              pointerEvents: "none",
              "*": {
                pointerEvents: "auto",
              },
            }}
          >
            {" "}
            <Box
              sx={{
                p: ".5em 1em",
                bgcolor: "rgba(255, 255, 255, 0.3)",
                borderRadius: "1em",
                backdropFilter: "blur(6px)",
                outline: focused ? "2px solid #1976d2" : "none",
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                value={artworkName}
                placeholder="Untitled artwork"
                onChange={(e) => setArtworkName(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                slotProps={{
                  input: { disableUnderline: true },
                }}
                sx={{
                  "& input": {
                    fontFamily: nunito.style.fontFamily,
                    color: "#0000009a",
                    width: { xs: "9em", sm: "12em" },
                  },
                }}
              />
            </Box>
            <Stack
              direction={"row"}
              gap={2}
              sx={{
                "& button": {
                  backgroundColor: "#b6b6b68a",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                  textTransform: "none",
                  borderRadius: "1em",

                  width: "3.6em",
                  height: "3.6em",
                  "&:hover": {
                    backgroundColor: "#999999ce",
                  },
                },
              }}
            >
              <button onClick={(e) => setMoreOptonsAnchorEl(e.currentTarget)}>
                <MoreHorizRoundedIcon />
              </button>
              <Menu
                anchorEl={moreOptonsAnchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                open={open}
                onClose={handleClose}
                slotProps={{
                  list: {
                    "aria-labelledby": "basic-button",
                  },
                }}
                sx={{ marginTop: ".5em" }}
              >
                <StyledListHeader>Canvas</StyledListHeader>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    setRefImageSelectDialogOpen(true);
                  }}
                >
                  Select reference image
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    clearAll();
                  }}
                >
                  Clear canvas
                </MenuItem>
                <StyledListHeader>Export</StyledListHeader>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    exportPNG();
                  }}
                >
                  Export artwork
                </MenuItem>
                <StyledListHeader>Navigation</StyledListHeader>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    router.push("./");
                  }}
                >
                  Go to Home
                </MenuItem>
              </Menu>
              <button>
                <LayersRoundedIcon />
              </button>
            </Stack>
          </Stack>
          <Box
            sx={{ flexGrow: 1, flexDirection: "column", position: "relative" }}
          >
            <Stack
              ref={leftToolbarAnchorRef}
              direction={{ xs: "row", sm: "column" }}
              alignItems={"center"}
              gap={2.5}
              sx={{
                position: "absolute",
                bottom: { xs: "1em", sm: "auto" },
                mt: { sm: "8em" },
                left: { xs: "1em", sm: "1em" },
                padding: { xs: ".6em .8em", sm: "1em .8em" },
                borderRadius: "9999px",
                backgroundColor: "#ffffffff",
                boxShadow: "0px 0px 5px 5px rgba(0, 0, 0, 0.04)",
                zIndex: 1000,
                "& .material-symbols-rounded": {
                  fontVariationSettings:
                    "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                },
              }}
            >
              <IconButton
                onClick={() => setTool("brush")}
                sx={{
                  backgroundColor:
                    tool === "brush" ? "#dfdfdfff !important" : "transparent",
                }}
              >
                <span className="material-symbols-rounded">brush</span>
              </IconButton>
              <IconButton
                onClick={() => setTool("eraser")}
                sx={{
                  backgroundColor:
                    tool === "eraser" ? "#dfdfdfff !important" : "transparent",
                }}
              >
                <span className="material-symbols-rounded">ink_eraser</span>
              </IconButton>
              <Box
                onClick={() => setColorSelectorOpen(!colorSelectorOpen)}
                sx={{
                  backgroundColor: brushColor,
                  borderRadius: "9999px",
                  width: "2em",
                  aspectRatio: 1,
                  cursor: "pointer",
                }}
              ></Box>{" "}
              <IconButton onClick={undo}>
                <span className="material-symbols-rounded">undo</span>
              </IconButton>
              <Popover
                open={colorSelectorOpen}
                anchorEl={leftToolbarAnchorRef.current}
                onClose={() => setColorSelectorOpen(false)}
                anchorOrigin={{
                  vertical: "center",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "center",
                  horizontal: "left",
                }}
                sx={{
                  marginLeft: "1em",
                  boxShadow: "0px 0px 5px 5px rgba(0, 0, 0, 0.1)",
                  "*": {
                    boxShadow: "none !important",
                  },
                }}
              >
                <ChromePicker
                  color={brushColor}
                  disableAlpha
                  onChangeComplete={(color) => setBrushColor(color.hex)}
                />
              </Popover>
            </Stack>
          </Box>
          <Stack
            direction="row"
            gap={2}
            alignItems="center"
            sx={{
              zIndex: 1000,
              p: ".2em 2em",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <Box>
              <Typography variant="caption">Stroke width</Typography>
              <Slider
                value={brushSize}
                min={1}
                max={50}
                onChange={(_, v) => setBrushSize(Array.isArray(v) ? v[0] : v)}
                size="small"
              />
            </Box>

            {/* Background opacity control */}
            <Box>
              <Typography variant="caption">Reference image opacity</Typography>

              <Slider
                value={bgOpacityPercent}
                min={0}
                max={100}
                onChange={(_, v) =>
                  setBgOpacityPercent(Array.isArray(v) ? v[0] : v)
                }
                size="small"
              />
            </Box>
          </Stack>
          <Box
            sx={{
              display: chatboxOpen ? "flex" : "none",
              zIndex: 1000,
              position: "absolute",
              bottom: "10em",
              transformOrigin: "bottom right",
              right: "1em",
              flexDirection: "column",
              gap: 2,
              p: 1.5,
              borderRadius: 4,
              backgroundColor: theme.palette.background.default,
              fontFamily: nunito.style.fontFamily,
              "*": {
                fontFamily: nunito.style.fontFamily,
              },
              boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.05)",
              width: { sm: "300px", xs: "300px", md: "300px" },
              maxWidth: "100vw",
              height: { sm: "400px", xs: "400px", md: "400px" },
            }}
          >
            <Box sx={{ width: "100%", flexGrow: 1, p: 2 }}>
              <Box
                sx={{
                  backgroundColor: "rgba(245, 245, 245, 1)",
                  borderRadius: "1em",
                  p: ".5em 1em",
                }}
              >
                {" "}
                <Typography>
                  This is my suggested drawing steps:
                  sky ➜ mountain ➜ grass ➜ water ➜ van
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: "100%",
                "& div": {
                  display: "inline-block",
                  backgroundColor: "rgba(245, 245, 245, 1)",
                  borderRadius: "9999px",
                  p: ".3em .6em",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  margin: ".3em",
                },
              }}
            >
              <Box>Drawing plan</Box>
              <Box>Comment on my drawing</Box>
            </Box>
            <Stack
            direction="row"
              sx={{
                alignItems: "center",
                width: "100%",
                backgroundColor: "rgba(245, 245, 245, 1)",
                borderRadius: "9999px",
                p: ".3em .5em",
              }}
            >
            <IconButton><AddRoundedIcon /></IconButton>
            <TextField variant="standard"        slotProps={{
                  input: { disableUnderline: true },
                }} />
              <IconButton><SendRoundedIcon /></IconButton>
            </Stack>
          </Box>
          <Box
            sx={{
              zIndex: 1000,
              position: "absolute",
              bottom: "5em",
              right: "1em",
              p: 1.5,
              borderRadius: 4,
              backgroundColor: theme.palette.background.default,
              ":hover": {
                backgroundColor: theme.palette.grey[100],
              },
              cursor: "pointer",
              boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box
              sx={{
                width: "2.2em",
                height: "2.2em",
                position: "relative",
                cursor: "pointer",
              }}
              onClick={(e) => setChatboxOpen(!chatboxOpen)}
            >
              <Image
                src={`${base}/logos/arthm-logo.svg`}
                alt="Arthm logo"
                fill={true}
                priority
              />
            </Box>
          </Box>
        </Stack>

        <Box
          ref={containerRef}
          sx={{
            width: "100vw",
            height: "100dvh",
            flexGrow: 1,
            background: "#ecececff",
            display: "block",
          }}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={stageScale}
            scaleY={stageScale}
            onWheel={handleWheel}
            draggable={isStageDraggable}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseDown={(ev) => {
              if (isStageDraggable) return;
              handlePointerDown(ev);
            }}
            onTouchStart={(ev) => {
              onTouchStart(ev);
              if (isStageDraggable) return;
              handlePointerDown(ev);
            }}
            onMouseMove={handlePointerMove}
            onTouchMove={(e) => {
              onTouchMove(e);
              if (isStageDraggable) return;
              handlePointerMove(e);
            }}
            onMouseUp={handlePointerUp}
            onTouchEnd={(ev) => {
              onTouchEnd(ev);
              handlePointerUp();
            }}
            style={{
              touchAction: "none",
              width: "100%",
              height: "100%",
              cursor: isStageDraggable
                ? isPanningRef.current
                  ? "grabbing"
                  : "grab"
                : tool === "brush"
                ? `url("data:image/svg+xml,${brushCursorSVG}") 12 12, auto`
                : `url("data:image/svg+xml,${eraserCursorSVG}") 12 12, auto`,
            }}
          >
            {/* Background layer (separate so eraser doesn't affect it) */}
            <Layer ref={bgLayerRef} listening={false}>
              <BackgroundImage
                src={refImageSrc}
                stageWidth={stageSize.width}
                stageHeight={stageSize.height}
                opacity={bgOpacity}
              />
            </Layer>

            <Layer ref={layerRef}>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.3}
                  lineCap={line.lineCap}
                  lineJoin={line.lineJoin}
                  globalCompositeOperation={line.compositeOperation}
                />
              ))}
            </Layer>
          </Stage>
        </Box>
      </Box>
      <WelcomeDialog
        open={welcomeDialogOpen}
        onClose={() => setWelcomeDialogOpen(false)}
      />
      <ReferenceImageDialog
        open={refImageSelectDialogOpen}
        onClose={() => setRefImageSelectDialogOpen(false)}
        onSelect={(src) => {
          if (!src) return;
          setRefImageSrc(src);
        }}
      />
    </>
  );
}
