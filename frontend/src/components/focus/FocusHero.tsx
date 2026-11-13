import { Box, Container, Typography } from "@mui/material";

export default function FocusHero() {
  return (
    <Box
      component="section"
      sx={{
        pt: { xs: 15, md: 21 },
        pb: { xs: 9, md: 13 },
        bgcolor: "#FFFFFF",
      }}
    >
      <Container maxWidth="xl">
        <Typography
          sx={{
            color: "#83834B",
            fontFamily: "Space Mono, monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            mb: 3,
          }}
        >
          04 / Our Focus
        </Typography>

        <Typography
          component="h1"
          sx={{
            maxWidth: 1000,
            fontFamily: "Cormorant Garamond, serif",
            fontSize: { xs: "3.2rem", sm: "4.5rem", md: "6.2rem" },
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
            color: "#1A1A1A",
          }}
        >
          Six Connected Areas.
          <Box component="span" sx={{ display: "block", color: "#83834B" }}>
            One Community-Led Approach.
          </Box>
        </Typography>

        <Box
          sx={{
            mt: { xs: 4, md: 6 },
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Typography
            sx={{
              maxWidth: 520,
              color: "#5F5F55",
              fontSize: { xs: "1rem", md: "1.12rem" },
              lineHeight: 1.9,
            }}
          >
            Our work connects environmental stewardship, practical skills,
            community knowledge and sustainable livelihood opportunities
            across rural and urban contexts.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
