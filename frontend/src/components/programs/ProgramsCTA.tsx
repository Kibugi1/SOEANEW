import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Box, Button, Container, Typography } from "@mui/material";

export default function ProgramsCTA() {
  return (
    <Box component="section" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 13 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "flex-end" },
            gap: 4,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#83834B",
                mb: 2,
              }}
            >
              Work with us
            </Typography>
            <Typography
              component="h2"
              sx={{
                maxWidth: 700,
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, md: 64 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              Help shape practical solutions with communities.
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 600, color: "#5F5F55", lineHeight: 1.8 }}>
              We welcome organisations and specialists who can contribute to
              community learning, practical skills and sustainable livelihoods.
            </Typography>
          </Box>

          <Button
            component="a"
            href="/programs/ceci/partnerships"
            variant="contained"
            endIcon={<ArrowOutwardRounded />}
            sx={{
              flexShrink: 0,
              bgcolor: "#83834B",
              "&:hover": { bgcolor: "#504624" },
            }}
          >
            Partner with CECI
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
