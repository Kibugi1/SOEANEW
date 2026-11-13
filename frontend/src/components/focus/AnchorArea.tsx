import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import { focusAnchor } from "@/data/focusAreas";

export default function AnchorArea() {
  return (
    <Box component="section" sx={{ pb: { xs: 10, md: 15 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 520, md: 560 },
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
            backgroundImage: `url("${focusAnchor.image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            bgcolor: "#504624",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(20,20,17,0.88) 0%, rgba(20,20,17,0.58) 58%, rgba(20,20,17,0.12) 100%)",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 820,
              p: { xs: 3, sm: 5, md: 8 },
              color: "#FFFFFF",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                color: "#D9AF3F",
                mb: 3,
                textTransform: "uppercase",
              }}
            >
              Our anchor
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: { xs: "2.8rem", md: "4.5rem" },
                lineHeight: 1,
                fontWeight: 600,
                mb: 3,
              }}
            >
              {focusAnchor.title}
            </Typography>

            <Typography
              sx={{
                maxWidth: 700,
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.88)",
              }}
            >
              {focusAnchor.description}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
