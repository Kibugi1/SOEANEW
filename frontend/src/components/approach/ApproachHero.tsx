import Image from "next/image";
import LinkButton from "@/components/ui/LinkButton";
import {
  Box,
  Container,
  Stack,
  Typography,
} from "@mui/material";

export default function ApproachHero() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#F5F5EF",
        minHeight: { xs: "auto", md: "690px" },
        display: "flex",
        alignItems: "center",
        py: { xs: 9, md: 12 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "0.95fr 1.05fr",
            },
            gap: { xs: 6, md: 8 },
            alignItems: "center",
          }}
        >
          {/* Editorial introduction */}
          <Stack spacing={3} sx={{ maxWidth: "650px" }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.72rem",
                letterSpacing: "0.16em",
                color: "#83834B",
                fontWeight: 600,
              }}
            >
              03 / OUR APPROACH
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: {
                  xs: "3.2rem",
                  sm: "4rem",
                  md: "4.7rem",
                  lg: "5.3rem",
                },
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              From Community Knowledge to{" "}
              <Box
                component="span"
                sx={{
                  color: "#83834B",
                  fontStyle: "italic",
                }}
              >
                Practical Climate Solutions.
              </Box>
            </Typography>

            <Typography
              sx={{
                maxWidth: "510px",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: "1rem", md: "1.12rem" },
                lineHeight: 1.85,
                color: "#5F5F55",
              }}
            >
              Our community-led approach develops skills, connects people to
              opportunity and builds evidence for lasting change.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ pt: 1 }}
            >
              <LinkButton
                href="#methodology"
                variant="contained"
                sx={{
                  backgroundColor: "#83834B",
                  color: "#FFFFFF",
                  borderRadius: 0,
                  px: 3.5,
                  py: 1.6,
                  textTransform: "none",
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#6F703E",
                  },
                }}
              >
                Explore Our Methodology
              </LinkButton>

              <LinkButton
                href="/programs/ceci"
                variant="outlined"
                sx={{
                  borderColor: "#83834B",
                  color: "#504624",
                  borderRadius: 0,
                  px: 3.5,
                  py: 1.6,
                  textTransform: "none",
                  fontFamily: '"DM Sans", sans-serif',
                  "&:hover": {
                    borderColor: "#504624",
                    backgroundColor: "rgba(131, 131, 75, 0.06)",
                  },
                }}
              >
                Explore CECI
              </LinkButton>
            </Stack>
          </Stack>

          {/* Documentary photograph */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: "390px", sm: "480px", md: "570px" },
              overflow: "hidden",
            }}
          >
            <Image
              src="/assets/images/community/rozaliaconferencepresenting.webp"
              alt="Community engagement and knowledge sharing during SOEA activities"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(20, 20, 15, 0.48) 100%)",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                p: { xs: 2.5, md: 4 },
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                }}
              >
                People · Skills · Solutions
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
