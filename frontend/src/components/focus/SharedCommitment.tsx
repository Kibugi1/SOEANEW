import { Box, Container, Typography } from "@mui/material";
import { sharedCommitment } from "@/data/focusAreas";

export default function SharedCommitment() {
  return (
    <Box component="section" sx={{ py: { xs: 10, md: 15 } }}>
      <Container maxWidth="lg">
        <Typography
          sx={{
            color: "#83834B",
            fontFamily: "Space Mono, monospace",
            fontSize: "0.68rem",
            letterSpacing: "0.13em",
            mb: 3,
            textAlign: "center",
          }}
        >
          OUR SHARED COMMITMENT
        </Typography>

        <Typography
          component="p"
          sx={{
            maxWidth: 1000,
            mx: "auto",
            textAlign: "center",
            fontFamily: "Cormorant Garamond, serif",
            fontSize: { xs: "1.45rem", md: "2.1rem" },
            lineHeight: 1.35,
            color: "#1A1A1A",
          }}
        >
          {sharedCommitment}
        </Typography>
      </Container>
    </Box>
  );
}
