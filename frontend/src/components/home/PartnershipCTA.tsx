"use client";

import {
  Box,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import LinkButton from "@/components/ui/LinkButton";

export default function PartnershipCTA() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        mx: { xs: 1.5, md: 3 },
        mb: { xs: 1.5, md: 3 },
        minHeight: { xs: "650px", md: "85vh" },
        display: "flex",
        alignItems: "center",
        bgcolor: "#504624",
        backgroundImage:
          'url("/assets/images/community/worktogether.webp")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#FFFFFF",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background:
            "linear-gradient(90deg, rgba(26,26,26,0.90) 0%, rgba(26,26,26,0.76) 55%, rgba(26,26,26,0.58) 100%)",
        },
      }}
    >
      <Container maxWidth="xl">
        <Grid
          container
          spacing={4}
          sx={{
            alignItems: "center",
            py: { xs: 10, md: 16, lg: 20 },
            minHeight: { xs: "650px", md: "85vh" },
          }}
        >
          {/* PARTNERSHIP MESSAGE */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#D9AF3F",
                mb: 3,
              }}
            >
              06 / Partner with us
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: {
                  xs: 43,
                  sm: 54,
                  md: 61,
                  lg: 70,
                },
                lineHeight: 1.02,
                fontWeight: 500,
                maxWidth: 760,
                color: "#FFFFFF",
              }}
            >
              Better solutions begin when we work together.
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 590,
                color: "rgba(255,255,255,0.78)",
                fontSize: { xs: 14, md: 15 },
                lineHeight: 1.9,
              }}
            >
              Connect with SOEA to explore collaboration, shared learning
              and opportunities to support community-centred climate
              solutions.
            </Typography>

            {/* CALL TO ACTION */}
            <Box sx={{ mt: 3 }}>
              <LinkButton
                href="/partner-with-us"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowOutwardRounded />}
                sx={{
                  minHeight: 54,
                  px: 3,
                  bgcolor: "#D9AF3F",
                  color: "#1A1A1A",
                  "&:hover": {
                    bgcolor: "#BA9327",
                  },
                }}
              >
                Start a conversation
              </LinkButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
