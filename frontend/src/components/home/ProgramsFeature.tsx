"use client";

import Image from "next/image";
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import LinkButton from "@/components/ui/LinkButton";

export default function ProgramsFeature() {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ py: { xs: 9, md: 13 } }}>
          <Grid
            container
            spacing={{ xs: 5, md: 8 }}
            sx={{ alignItems: "center" }}
          >
            {/* PROGRAM INTRODUCTION */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.7rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#83834B",
                  }}
                >
                  05 / Programs
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: {
                      xs: 44,
                      sm: 54,
                      md: 61,
                      lg: 70,
                    },
                    lineHeight: 1.02,
                    fontWeight: 500,
                    maxWidth: 680,
                    color: "#1A1A1A",
                  }}
                >
                  Turning learning into practical action.
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 600,
                    color: "#5F5F55",
                    fontSize: { xs: 14, md: 15 },
                    lineHeight: 1.9,
                  }}
                >
                  Through the Community Environmental Champions Initiative
                  (CECI), SOEA co-designs practical learning and livelihood
                  pathways with communities, turning local knowledge into
                  skills, safer working conditions, economic opportunities and
                  environmental leadership. Its first flagship project, WP-LIFT,
                  focuses on waste pickers and five practical pathways: organic
                  waste composting, plastic recycling and upcycling, glass
                  recovery and cutting, e-waste management, and textile recovery
                  and upcycling. These pathways are complemented by legal rights
                  advocacy, occupational health and safety, financial literacy,
                  entrepreneurship, mentorship and market connections, helping
                  communities build the capabilities and opportunities to
                  sustain transformational change.
                </Typography>

                {/* Program → first flagship project (feedback 19 Nov 2026, §2.3) */}
                <Box
                  sx={{
                    borderLeft: "3px solid #83834B",
                    pl: 2.5,
                    py: 0.5,
                    maxWidth: 600,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#83834B",
                    }}
                  >
                    Flagship Program
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "#1A1A1A", mt: 0.5 }}>
                    Community Environmental Champions Initiative (CECI)
                  </Typography>
                  <Typography sx={{ color: "#5F5F55", fontSize: 14, lineHeight: 1.8, mt: 1 }}>
                    First flagship project:{" "}
                    <Box component="strong" sx={{ color: "#504624" }}>
                      WP-LIFT — Waste Pickers&rsquo; Livelihood Improvement for
                      Transformation
                    </Box>
                    , underway in Dandora and Mathare, Nairobi County.
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                  <LinkButton
                    href="/programs/ceci"
                    variant="contained"
                    endIcon={<ArrowOutwardRounded />}
                  >
                    Discover CECI
                  </LinkButton>
                  <LinkButton
                    href="/programs/ceci#wp-lift"
                    variant="outlined"
                    endIcon={<ArrowOutwardRounded />}
                  >
                    The WP-LIFT project
                  </LinkButton>
                </Stack>
              </Stack>
            </Grid>

            {/* FEATURED PROGRAM IMAGE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  minHeight: { xs: 390, sm: 480, md: 540 },
                  overflow: "hidden",
                  bgcolor: "#F7F7F1",
                }}
              >
                <Image
                  src="/assets/images/community/ceciplanning.webp"
                  alt="Community Environmental Champions Initiative planning session"
                  fill
                  priority={false}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />

                {/* IMAGE OVERLAY */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 45%, rgba(20,20,17,0.78) 100%)",
                  }}
                />

                {/* IMAGE CAPTION */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: { xs: 3, md: 4 },
                    color: "#FFFFFF",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#D9AF3F",
                      mb: 1.5,
                    }}
                  >
                    Flagship program
                  </Typography>

                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: { xs: 32, md: 42 },
                      lineHeight: 1.05,
                      fontWeight: 500,
                      maxWidth: 450,
                    }}
                  >
                    Community Environmental Champions Initiative
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      maxWidth: 470,
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    Home of WP-LIFT, our first flagship project, co-designed
                    with waste pickers in Dandora and Mathare.
                  </Typography>
                </Box>
              </Box>

              {/* IMPLEMENTATION LOCATION */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid #E5E5DD",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#83834B",
                  }}
                >
                  WP-LIFT underway in
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    color: "#504624",
                  }}
                >
                  Dandora & Mathare, Nairobi
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
