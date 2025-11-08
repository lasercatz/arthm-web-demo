"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import styles from "./page.module.css";
import {
  Box,
  Button,
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
import CloseIcon from "@mui/icons-material/Close";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { styled } from "@mui/material/styles";
import { Nunito } from "next/font/google";

import ReferenceImageDialog from "../components/ReferenceImageDialog";
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

export default function Page({
  width = 1200,
  height = 720,
  base = "",
}: {
  width?: number;
  height?: number;
  base?: string;
}) {
  const router = useRouter();
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const bgLayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // drawing state
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

  // responsive stage size
  const [stageSize, setStageSize] = useState({ width, height });

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

  // touch handling: two-finger drag => pan; one-finger => draw
  const onTouchStart = (e: any) => {
    const touches = e?.evt?.touches;
    if (!touches) return;
    if (touches.length === 2) {
      isPanningRef.current = true;
      setIsStageDraggable(true);
    } else if (touches.length === 1) {
      if (isStageDraggable) return;
    }
  };

  const onTouchEnd = (e: any) => {
    const touches = e?.evt?.touches;
    const count = touches ? touches.length : 0;
    if (count < 2) {
      isPanningRef.current = false;
      if (!spacePressed) setIsStageDraggable(false);
    }
  };

  // ResizeObserver to keep stage full-size inside the middle flex container
  useEffect(() => {
    const roTarget = containerRef.current;
    if (!roTarget) {
      setStageSize({ width, height });
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
  }, [width, height]);

  // cursor style: show grab when panning mode active
  const cursorStyle = isStageDraggable
    ? isPanningRef.current
      ? "grabbing"
      : "grab"
    : "default";
  const [focused, setFocused] = useState(false);
  const [artworkName, setArtworkName] = useState("");
  const [moreOptonsAnchorEl, setMoreOptonsAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const open = Boolean(moreOptonsAnchorEl);
  const handleClose = () => {
    setMoreOptonsAnchorEl(null);
  };

  const [refImageSelectDialogOpen, setRefImageSelectDialogOpen] =
    useState(true);

  const [refImageSrc, setRefImageSrc] = useState<string>("");
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
                placeholder="Untitiled artwork"
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
              >
                <StyledListHeader>Canvas</StyledListHeader>
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
                <HistoryRoundedIcon />
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
                left: {xs:"50%",sm:"1em"},
                transform: {xs:"translateX(-50%)",sm:"translateX(0)"},
                padding: {xs: ".6em .8em",sm:"1em .8em"},
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
                    tool === "brush" ? "#dfdfdfff" : "transparent",
                }}
              >
                <span className="material-symbols-rounded">brush</span>
              </IconButton>
              <IconButton
                onClick={() => setTool("eraser")}
                sx={{
                  backgroundColor:
                    tool === "eraser" ? "#dfdfdfff" : "transparent",
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
                  overflow: "hidden", // ensures input stays inside
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
        </Stack>

        <Stack
          direction="column"
          sx={{
            width: "100vw",
            height: "100dvh",
          }}
        >
          {/* Toolbar */}

          {/* Canvas area (flex grow, measured by ResizeObserver) */}
          <Box
            ref={containerRef}
            sx={{
              width: "100%",
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
              onTouchMove={(ev) => {
                if (isStageDraggable) return;
                handlePointerMove(ev);
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
                cursor: cursorStyle,
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

              {/* Drawing layer - strokes live here and can be erased */}
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
        </Stack>
      </Box>

      <ReferenceImageDialog
        open={refImageSelectDialogOpen}
        onClose={() => setRefImageSelectDialogOpen(false)}
        onSelect={(src) => {
          if (!src) return;
          setRefImageSrc(src);
          // optional: close dialog immediately when selecting (if you want)
          // setDialogOpen(false);
        }}
      />
    </>
  );
}
