"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Stack,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

const MotionBox = motion(Box);

const imagePath = "/assets/images/community/";

const themes = [
  {
    number: "01",
    title: "Circular economy & waste",
    slug: "circular-economy",
    image: `${imagePath}rozaliaconferencepresenting.webp`,
  },
  {
    number: "02",
    title: "Gender-responsive climate resilience",
    slug: "gender-responsive-climate-resilience",
    image: `${imagePath}gender.webp`,
  },
  {
    number: "03",
    title: "Climate-smart agriculture & agroforestry",
    slug: "climate-smart-agriculture",
    image: `${imagePath}tractor.webp`,
  },
  {
    number: "04",
    title: "Blue economy & coastal resilience",
    slug: "blue-economy",
    image: `${imagePath}blueeconomy.webp`,
  },
  {
    number: "05",
    title: "Just & equitable energy transition",
    slug: "energy-transition",
    image: `${imagePath}justenergy.webp`,
  },
  {
    number: "06",
    title: "Climate technology, data & early warning",
    slug: "climate-technology",
    image: `${imagePath}climatedata.webp`,
  },
];

const initialImage = `${imagePath}connectedchallenges.webp`;

export default function ThematicFocus() {
  const [activeTheme, setActiveTheme] = useState<number | null>(null);

  const currentImage =
    activeTheme !== null ? themes[activeTheme].image : initialImage;

  const resetSection = () => setActiveTheme(null);

  return (
    <Box
      component="section"
      onMouseLeave={resetSection}
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: "auto", md: "780px" },
        bgcolor: "#1A1A1A",
        color: "#FFFFFF",
        isolation: "isolate",
      }}
    >
      {/* BACKGROUND IMAGE */}
      <AnimatePresence mode="sync">
        <MotionBox
          key={currentImage}
          initial={{
            opacity: 0,
            scale: 1.04,
          }}
          animate={{
            opacity: activeTheme !== null ? 0.68 : 0.30,
            scale: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: -2,
            backgroundImage: `url("${currentImage}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: activeTheme !== null ? "blur(0px)" : "blur(5px)",
            transition: "filter 0.8s ease",
          }}
        />
      </AnimatePresence>

      {/* DARK OVERLAY */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "linear-gradient(90deg, rgba(20,20,17,0.94) 0%, rgba(20,20,17,0.76) 48%, rgba(20,20,17,0.56) 100%)",
          transition: "background 0.6s ease",
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          py: { xs: 9, md: 14 },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 7, md: 10 }}
          alignItems="flex-start"
        >
          {/* LEFT INTRODUCTION - SPACE ALWAYS RESERVED */}
          <Box
            sx={{
              width: { xs: "100%", md: "40%" },
              flexShrink: 0,
              position: "sticky",
              top: 100,
            }}
          >
            <AnimatePresence mode="wait">
              {activeTheme === null && (
                <MotionBox
                  key="thematic-introduction"
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  sx={{
                    width: "100%",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Space Mono, monospace",
                      fontSize: "0.7rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#D9AF3F",
                      mb: 3,
                    }}
                  >
                    Where we work
                  </Typography>

                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: {
                        xs: "2.8rem",
                        sm: "3.5rem",
                        md: "4.5rem",
                      },
                      lineHeight: 0.98,
                      fontWeight: 500,
                      maxWidth: "520px",
                      mb: 4,
                    }}
                  >
                    Connecting the dots.{" "}
                    <Box component="span" sx={{ color: "#D9AF3F" }}>
                      Creating lasting change.
                    </Box>
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "1rem",
                      lineHeight: 1.9,
                      color: "rgba(255,255,255,0.72)",
                      maxWidth: "430px",
                      mb: 5,
                    }}
                  >
                    We work across interconnected environmental and livelihood
                    themes, recognising that local challenges rarely exist in
                    isolation.
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "Space Mono, monospace",
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.48)",
                      textTransform: "uppercase",
                    }}
                  >
                    Explore our thematic areas
                  </Typography>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>

          {/* RIGHT THEMATIC AREAS */}
          <Box
            sx={{
              width: { xs: "100%", md: "60%" },
              pt: { xs: 0, md: 2 },
            }}
          >
            {themes.map((theme, index) => {
              const isActive = activeTheme === index;
              const isInactive =
                activeTheme !== null && activeTheme !== index;

              return (
                <MotionBox
                  key={theme.number}
                  layout
                  onMouseEnter={() => setActiveTheme(index)}
                  onFocus={() => setActiveTheme(index)}
                  sx={{
                    position: "relative",
                    borderBottom: "1px solid rgba(255,255,255,0.22)",
                    py: { xs: 2.5, md: 3.2 },
                    px: { xs: 1, md: 2 },
                    opacity: isInactive ? 0.28 : 1,
                    transform: isActive
                      ? "translateY(-5px) scale(1.015)"
                      : "translateY(0) scale(1)",
                    background: isActive
                      ? "rgba(255,255,255,0.09)"
                      : "transparent",
                    boxShadow: isActive
                      ? "0 12px 35px rgba(0,0,0,0.18)"
                      : "none",
                    transition:
                      "opacity 0.45s ease, transform 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.68rem",
                        color: isActive ? "#D9AF3F" : "rgba(255,255,255,0.5)",
                        minWidth: "28px",
                      }}
                    >
                      {theme.number}
                    </Typography>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component={Link}
                        href={`/thematic-areas/${theme.slug}`}
                        sx={{
                          display: "block",
                          color: "#FFFFFF",
                          textDecoration: "none",
                          fontFamily: "Cormorant Garamond, serif",
                          fontSize: {
                            xs: "1.55rem",
                            sm: "1.9rem",
                            md: "2.15rem",
                          },
                          lineHeight: 1.15,
                          fontWeight: isActive ? 600 : 400,
                          transition: "color 0.3s ease",
                          "&:hover": {
                            color: "#D9AF3F",
                          },
                        }}
                      >
                        {theme.title}
                      </Typography>
                    </Box>

                    <Box
                      component={Link}
                      href={`/thematic-areas/${theme.slug}`}
                      aria-label={`Explore ${theme.title}`}
                      sx={{
                        color: isActive ? "#D9AF3F" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.3s ease",
                        transform: isActive ? "translate(3px, -3px)" : "none",
                      }}
                    >
                      <ArrowOutwardRoundedIcon />
                    </Box>
                  </Stack>
                </MotionBox>
              );
            })}
          </Box>
        </Stack>

        {/* RESET CONTROL */}
        <AnimatePresence>
          {activeTheme !== null && (
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              sx={{
                mt: 5,
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Box
                component="button"
                onClick={resetSection}
                sx={{
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: 0,
                  background: "rgba(0,0,0,0.2)",
                  color: "#FFFFFF",
                  px: 2.5,
                  py: 1.3,
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  "&:hover": {
                    background: "#D9AF3F",
                    color: "#1A1A1A",
                    borderColor: "#D9AF3F",
                  },
                }}
              >
                Reset view
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}
