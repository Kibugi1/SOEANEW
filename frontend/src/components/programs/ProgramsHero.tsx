import { Box, Container, Typography } from "@mui/material";

export default function ProgramsHero() {
  return (
    <Box component="section" sx={{ pt: { xs: 15, md: 21 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl">
        <Typography
          sx={{
            fontFamily: '"Space Mono", monospace',
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#83834B",
            mb: 3,
          }}
        >
          05 / Our Programmes
        </Typography>

        <Typography
          component="h1"
          sx={{
            maxWidth: 900,
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: { xs: 48, sm: 64, md: 88 },
            lineHeight: 0.98,
            fontWeight: 500,
            letterSpacing: "-0.035em",
            color: "#1A1A1A",
          }}
        >
          Programs Rooted in People and Practical Action
        </Typography>

        <Typography
          sx={{
            mt: 4,
            maxWidth: 720,
            color: "#5F5F55",
            fontSize: { xs: 15, md: 17 },
            lineHeight: 1.9,
          }}
        >
          SOEA programs connect community knowledge, structured learning,
          innovation, and partnerships to climate-resilient livelihoods.
          Explore our active work and emerging initiatives, with clear updates
          on development stages and progress.
        </Typography>
      </Container>
    </Box>
  );
}
