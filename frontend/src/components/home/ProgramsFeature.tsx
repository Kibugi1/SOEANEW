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
            alignItems="center"
          >
            {/* PROGRAM INTRODUCTION */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3} alignItems="flex-start">
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
                  Explore the Community Eco-Circular Initiative (CECI),
                  SOEA's cross-thematic initiative connecting environmental
                  learning, practical skills and livelihood opportunities.
                </Typography>

                <LinkButton
                  href="/programs/ceci"
                  variant="contained"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{ mt: 1 }}
                >
                  Discover CECI
                </LinkButton>
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
                  alt="Community Eco-Circular Initiative planning session"
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
                    Featured initiative
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
                    Community Eco-Circular Initiative
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
                    Connecting circular-economy learning with practical
                    pathways around waste, recovery, skills and livelihoods.
                  </Typography>
                </Box>
              </Box>

              {/* IMPLEMENTATION LOCATION */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                sx={{
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
                  Initial implementation focus
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
