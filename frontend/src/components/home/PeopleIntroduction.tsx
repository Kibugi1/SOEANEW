"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";

const photographs = [
  {
    src: "/assets/images/community/countyofficersmatharerozalia.JPEG",
    alt: "Community and county-level engagement in Mathare",
    title: "Working together",
    category: "COMMUNITY ENGAGEMENT",
  },
  {
    src: "/assets/images/community/datassessmentdandora.JPEG",
    alt: "Environmental data assessment in Dandora",
    title: "Understanding our communities",
    category: "FIELD ASSESSMENT",
  },
  {
    src: "/assets/images/community/Blackwhitepic.jpg",
    alt: "People connected through the work of Square One Eco Africa",
    title: "People at the centre",
    category: "OUR COMMUNITY",
  },
  {
    src: "/assets/images/community/rozaliaconference.jpg",
    alt: "Square One Eco Africa representation at a conference",
    title: "Sharing knowledge",
    category: "COLLABORATION",
  },
  {
    src: "/assets/images/community/speranzasiteweigh.jpg",
    alt: "A practical community site activity",
    title: "Practical action",
    category: "FIELD WORK",
  },
  {
    src: "/assets/images/community/dandoraradiomeeting.jpeg",
    alt: "Community radio meeting in Dandora",
    title: "Conversations that matter",
    category: "COMMUNITY VOICES",
  },
];

const wrapIndex = (index: number) =>
  (index + photographs.length) % photographs.length;

export default function PeopleIntroduction() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = photographs[activeIndex];

  const showNext = () => {
    setActiveIndex((current) => wrapIndex(current + 1));
  };

  const showPrevious = () => {
    setActiveIndex((current) => wrapIndex(current - 1));
  };

  const nextPhoto = photographs[wrapIndex(activeIndex + 1)];
  const secondNextPhoto = photographs[wrapIndex(activeIndex + 2)];

  return (
    <Box
      component="section"
      aria-labelledby="people-introduction-heading"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        py: { xs: 9, sm: 11, md: 15 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 0.82fr) minmax(0, 1.18fr)",
            },
            alignItems: "center",
            columnGap: { xs: 5, md: 7, lg: 10 },
            rowGap: { xs: 5, md: 3 },
          }}
        >
          {/* Editorial introduction */}
          <Box sx={{ maxWidth: 510 }}>
            <Typography
              sx={{
                mb: 2.5,
                fontFamily: '"Space Mono", monospace',
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "#83834B",
                textTransform: "uppercase",
              }}
            >
              01 / Who we are
            </Typography>

            <Typography
              id="people-introduction-heading"
              component="h2"
              sx={{
                maxWidth: 480,
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: "clamp(2.8rem, 4.4vw, 4.5rem)",
                fontWeight: 600,
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                color: "#292719",
              }}
            >
              Change starts{" "}
              <Box
                component="span"
                sx={{
                  display: "inline",
                  color: "#83834B",
                  fontStyle: "italic",
                }}
              >
                with people.
              </Box>
            </Typography>

            <Box
              sx={{
                width: 54,
                height: 2,
                bgcolor: "#D9AF3F",
                my: 3.5,
              }}
            />

            <Typography
              sx={{
                maxWidth: 460,
                color: "#5F5F55",
                fontSize: { xs: 16, md: 17 },
                lineHeight: 1.9,
              }}
            >
              Square One Eco Africa brings communities, skills and practical
              solutions together around environmental challenges and
              sustainable livelihoods.
            </Typography>

            <Box
              component={Link}
              href="/who-we-are"
              sx={{
                mt: 3.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 1.2,
                color: "#504624",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                transition: "color 180ms ease, gap 180ms ease",
                "&:hover": {
                  color: "#83834B",
                  gap: 1.8,
                },
              }}
            >
              Get to know SOEA
              <ArrowOutwardRounded sx={{ fontSize: 18 }} />
            </Box>
          </Box>

          {/* Interactive photographic album */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 680,
              justifySelf: { xs: "center", md: "end" },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: {
                  xs: 340,
                  sm: 420,
                  md: "clamp(390px, 37vw, 510px)",
                },
                isolation: "isolate",
              }}
            >
              {/* Back photograph: second in the stack */}
              <motion.div
                key={`back-${nextPhoto.src}`}
                initial={{ opacity: 0, x: 25, rotate: 0 }}
                animate={{ opacity: 1, x: 0, rotate: 7 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  inset: "5% 4% 8% 8%",
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E5E5DD",
                    borderRadius: "3px",
                    p: { xs: 1, sm: 1.5 },
                    boxShadow: "0 18px 45px rgba(45, 39, 22, 0.12)",
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                    <Image
                      src={nextPhoto.src}
                      alt={nextPhoto.alt}
                      fill
                      sizes="(max-width: 900px) 85vw, 45vw"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </Box>
              </motion.div>

              {/* Back photograph: third in the stack */}
              <motion.div
                key={`second-back-${secondNextPhoto.src}`}
                initial={{ opacity: 0, x: -20, rotate: 0 }}
                animate={{ opacity: 1, x: 0, rotate: -6 }}
                transition={{
                  duration: 0.45,
                  delay: 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  position: "absolute",
                  inset: "3% 8% 10% 3%",
                  zIndex: 0,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E5E5DD",
                    borderRadius: "3px",
                    p: { xs: 1, sm: 1.5 },
                    boxShadow: "0 18px 45px rgba(45, 39, 22, 0.10)",
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                    <Image
                      src={secondNextPhoto.src}
                      alt={secondNextPhoto.alt}
                      fill
                      sizes="(max-width: 900px) 85vw, 45vw"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                </Box>
              </motion.div>

              {/* Active photograph */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhoto.src}
                  initial={{ opacity: 0, x: 45, rotate: 3, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, rotate: -1.5, scale: 1 }}
                  exit={{ opacity: 0, x: -55, rotate: -7, scale: 0.94 }}
                  transition={{
                    duration: 0.48,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Current photograph: ${activePhoto.title}. Activate to view the next photograph.`}
                  onClick={showNext}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      showNext();
                    }
                  }}
                  style={{
                    position: "absolute",
                    inset: "0 10% 12% 0",
                    zIndex: 2,
                    cursor: "pointer",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      bgcolor: "#FFFFFF",
                      border: "1px solid #E5E5DD",
                      borderRadius: "3px",
                      p: { xs: 1, sm: 1.5 },
                      pb: { xs: 5.5, sm: 6 },
                      boxShadow: "0 24px 65px rgba(45, 39, 22, 0.18)",
                      transition: "box-shadow 200ms ease",
                      "&:hover": {
                        boxShadow: "0 30px 75px rgba(45, 39, 22, 0.22)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        bgcolor: "#E5E5DD",
                      }}
                    >
                      <Image
                        src={activePhoto.src}
                        alt={activePhoto.alt}
                        fill
                        priority
                        sizes="(max-width: 900px) 85vw, 45vw"
                        style={{ objectFit: "cover" }}
                      />

                      <Box
                        sx={{
                          position: "absolute",
                          inset: "55% 0 0",
                          background:
                            "linear-gradient(transparent, rgba(20, 22, 15, 0.42))",
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        position: "absolute",
                        left: { xs: 12, sm: 18 },
                        bottom: { xs: 12, sm: 17 },
                        fontFamily: '"Space Mono", monospace',
                        fontSize: { xs: 8, sm: 9 },
                        letterSpacing: "0.12em",
                        color: "#504624",
                        textTransform: "uppercase",
                      }}
                    >
                      {activePhoto.title}
                    </Typography>
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Album label */}
              <Box
                sx={{
                  position: "absolute",
                  zIndex: 3,
                  right: 0,
                  bottom: { xs: 5, sm: 10 },
                  px: 2,
                  py: 1.2,
                  bgcolor: "#83834B",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 22px rgba(45, 39, 22, 0.16)",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 8,
                    letterSpacing: "0.12em",
                  }}
                >
                  {activePhoto.category}
                </Typography>
              </Box>
            </Box>

            {/* Album controls and counter */}
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mt: { xs: 1, sm: 2 },
                pt: 2,
                borderTop: "1px solid #E5E5DD",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    color: "#83834B",
                    textTransform: "uppercase",
                  }}
                >
                  A glimpse into our work
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: 12,
                    color: "#5F5F55",
                  }}
                >
                  Click the photograph to turn the page
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <Typography
                  aria-live="polite"
                  sx={{
                    mr: 1,
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 11,
                    color: "#504624",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(activeIndex + 1).padStart(2, "0")}
                  <Box component="span" sx={{ color: "#A8A658", mx: 0.5 }}>
                    /
                  </Box>
                  {String(photographs.length).padStart(2, "0")}
                </Typography>

                <IconButton
                  onClick={showPrevious}
                  aria-label="Previous photograph"
                  size="small"
                  sx={{
                    width: 38,
                    height: 38,
                    border: "1px solid #E5E5DD",
                    color: "#504624",
                    "&:hover": {
                      bgcolor: "#F3F3EC",
                      borderColor: "#83834B",
                    },
                  }}
                >
                  <ArrowBackRounded fontSize="small" />
                </IconButton>

                <IconButton
                  onClick={showNext}
                  aria-label="Next photograph"
                  size="small"
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: "#83834B",
                    color: "#FFFFFF",
                    "&:hover": {
                      bgcolor: "#68683B",
                    },
                  }}
                >
                  <ArrowForwardRounded fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
