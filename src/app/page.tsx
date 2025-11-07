import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Box, Stack } from "@mui/material";
import { Sour_Gummy, Nunito } from "next/font/google";
import BrushRoundedIcon from "@mui/icons-material/BrushRounded";
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded';
import ArrowDropDownCircleRoundedIcon from "@mui/icons-material/ArrowDropDownCircleRounded";
const sourgummy = Sour_Gummy({ weight: "400", subsets: ["latin"] });

const nunito = Nunito({
  weight: ["500", "600"],
  subsets: ["latin"],
});
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default function Home() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Box
          p="5em 3em"
          sx={{
            width: "100vw",
            minHeight: "100vh",
            backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH}/_root/bg.jpg)`,
            backgroundSize: "cover",
          }}
        >
          <Box
  
            sx={{
              position: "absolute",
              bottom: "2em",
              left: "50%",
              transform: "translateX(-50%)",
              opacity: 0.5,

              color: "#707070ff",
            }}
          >
            <ArrowDropDownCircleRoundedIcon sx={{ fontSize: "2em" }} />
          </Box>
          <Box
            p={2}
            sx={{
              position: "absolute",
              right: 0,
              bottom: 0,
              fontSize: "0.75em",
              textAlign: "right",
            }}
          >
            The background is painted by Arthm.&nbsp;&nbsp;&nbsp;
            <a
              href="https://unsplash.com/photos/pink-and-orange-paints-zA7I5BtFbvw"
              target="_blank"
            >
              Original
            </a>
          </Box>
          <Stack direction="column" gap={2} alignItems="center" width={"100%"}>
            <Box
              sx={{
                fontSize: "4em",
                fontWeight: "500",
                fontFamily: sourgummy.style.fontFamily,
                "*": {
                  fontFamily: sourgummy.style.fontFamily,
                },
              }}
            >
              Your AI{" "}
              <span
                style={{
                  background:
                    "linear-gradient(319deg, #6a5acd 0%, #c54b8c 37%, #b284be 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text", // for future support
                }}
              >
                drawing
              </span>{" "}
              companion
            </Box>

            <Box
              sx={{
                fontSize: "1.5em",
                fontFamily: nunito.style.fontFamily,
                marginTop: "1.5em",
                fontWeight: "600",
                color: "#444444ff",
              }}
            >
              who draws & grows with you
            </Box>
            <button
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: ".8em",
                border: "1px solid #ccc",
                marginTop: "3em",
              }}
            >
              <Stack
                direction="row"
                gap={1}
                alignItems={"center"}
                sx={{
                  background: "#fff",

                  padding: "0.5em 1em",

                  fontSize: "1.8em",
                  fontFamily: nunito.style.fontFamily,
                  "&:hover": {
                    background: "#f5f5f5",
                  },
                }}
              >
                <BrushRoundedIcon />
                Start drawing
              </Stack>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "40%",
                  height: "50%",
                  pointerEvents: "none",
                  backgroundImage: `
        linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)
      `,
                  backgroundSize: "10px 10px",
                  opacity: 0.4,
                  maskImage:
                    "linear-gradient(to bottom left, black 60%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom left, black 60%, transparent 100%)",
                }}
              ></div>
            </button>
            <Box sx={{ color: "#4b4b4bff", fontSize: "0.8em" }}>
              - For demo purpose only -
            </Box>
          </Stack>
        </Box>
        <Box padding={"5em 2em"} sx={{textAlign: "center"}}>
          <Stack direction="column" gap={5} alignItems="center" sx={{
            ".frame":{
              width: "100%",
              maxWidth: "350px",
              borderRadius: "1em",
            }
          }}>
            <Box sx={{ fontSize: "1.6em", fontWeight: "500" }}>
              Painting by Arthm
            </Box>
            <Stack direction={"row"} flexWrap={"wrap"} gap={2} alignItems={"center"} justifyContent={"center"}>
              <img className="frame" src={`${base}/_root/demo_input.webp`} alt="" />
              <KeyboardDoubleArrowRightRoundedIcon/>
              <img className="frame" src={`${base}/_root/demo_output.webp`} alt="" />
            </Stack>
              <Box sx={{ fontSize: "1.6em", fontWeight: "500" }}>
              Painting process
            </Box>
            <video className="frame" src={`${base}/_root/demo_process.mp4`} autoPlay={true} loop={true} muted={true} controls={true}></video>
          <Box>This Arthm AI model can draw any image at the resolution of 384x384 pixels.</Box>
          <Box>Photo on <a target="_blank" href="https://unsplash.com/photos/a-serene-lake-surrounded-by-grassy-hills-and-snow-capped-mountains-K4gXZ-WLaoE">Unsplash</a></Box>
          </Stack>
        </Box>
      </main>
    </div>
  );
}
