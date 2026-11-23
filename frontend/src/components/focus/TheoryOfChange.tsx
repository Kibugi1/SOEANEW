import { Box, Container, Typography } from "@mui/material";
import { theoryOfChange } from "@/data/focusAreas";

/** Theory of change / value proposition (SOEA website feedback, 19 Nov 2026, §4.3). */
export default function TheoryOfChange() {
  return (
    <Box component="section" aria-labelledby="theory-of-change" sx={{ py: { xs: 9, md: 13 }, bgcolor: "#F5F5EF" }}>
      <Container maxWidth="lg">
        <Typography
          sx={{
            color: "#83834B",
            fontFamily: "Space Mono, monospace",
            fontSize: "0.68rem",
            letterSpacing: "0.13em",
            mb: 3,
          }}
        >
          OUR THEORY OF CHANGE
        </Typography>
        <Typography
          id="theory-of-change"
          component="h2"
          sx={{
            maxWidth: 900,
            fontFamily: "Cormorant Garamond, serif",
            fontSize: { xs: "2rem", md: "3rem" },
            lineHeight: 1.15,
            color: "#1A1A1A",
          }}
        >
          {theoryOfChange.headline}
        </Typography>
        <Typography sx={{ mt: 4, maxWidth: 820, color: "#5F5F55", fontSize: { xs: "1rem", md: "1.08rem" }, lineHeight: 1.9 }}>
          {theoryOfChange.body}
        </Typography>
      </Container>
    </Box>
  );
}
