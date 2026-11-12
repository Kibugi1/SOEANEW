import { Box, Container, Typography } from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

export default function FocusCTA() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 9, md: 12 },
        bgcolor: "#504624",
        color: "#FFFFFF",
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "flex-end" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#D9AF3F",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
                mb: 2,
              }}
            >
              HOW WE WORK
            </Typography>
            <Typography
              component="h2"
              sx={{
                maxWidth: 700,
                fontFamily: "Cormorant Garamond, serif",
                fontSize: { xs: "3rem", md: "4.7rem" },
                lineHeight: 1,
                fontWeight: 600,
              }}
            >
              See Our Approach in Action
            </Typography>
          </Box>

          <Box
            component="a"
            href="/our-approach"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              color: "#1A1A1A",
              bgcolor: "#D9AF3F",
              px: 3,
              py: 2,
              textDecoration: "none",
              fontWeight: 600,
              transition: "background 0.25s ease, gap 0.25s ease",
              "&:hover": {
                bgcolor: "#FFFFFF",
                gap: 3,
              },
            }}
          >
            Explore Our Approach
            <ArrowOutwardRoundedIcon />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
