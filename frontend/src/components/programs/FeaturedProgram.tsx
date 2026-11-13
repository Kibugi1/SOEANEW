import Image from "next/image";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import type { Programme } from "@/data/programs";

type Props = {
  programme: Programme;
};

export default function FeaturedProgram({ programme }: Props) {
  return (
    <Box component="section" sx={{ pb: { xs: 10, md: 16 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
            gap: { xs: 5, md: 9 },
            alignItems: "center",
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "#83834B",
              }}
            >
              Featured programme / {programme.shortName}
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, sm: 52, md: 62 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              {programme.title}
            </Typography>

            <Typography sx={{ color: "#5F5F55", lineHeight: 1.9 }}>
              {programme.description}
            </Typography>

            <Box
              sx={{
                borderLeft: "2px solid #D9AF3F",
                pl: 2.5,
                py: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#83834B",
                  mb: 1,
                }}
              >
                Current stage
              </Typography>
              <Typography sx={{ color: "#504624", fontWeight: 600 }}>
                {programme.currentPhase}
              </Typography>
            </Box>

            <Typography sx={{ color: "#5F5F55", fontSize: 14 }}>
              {programme.location.join(" · ")}
            </Typography>

            <Button
              component="a"
              href={`/programs/${programme.slug}`}
              variant="contained"
              endIcon={<ArrowOutwardRounded />}
              sx={{
                bgcolor: "#83834B",
                "&:hover": { bgcolor: "#504624" },
              }}
            >
              Explore the programme
            </Button>
          </Stack>

          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 360, sm: 480, md: 590 },
              overflow: "hidden",
              bgcolor: "#F3F3EC",
            }}
          >
            <Image
              src={programme.coverImage}
              alt="SOEA community programme planning session"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 55vw"
              style={{ objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(20,20,17,0.7) 100%)",
              }}
            />
            <Box sx={{ position: "absolute", bottom: 0, left: 0, p: 3, color: "#fff" }}>
              <Typography
                sx={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#D9AF3F",
                }}
              >
                Nairobi County, Kenya
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 30, md: 40 },
                }}
              >
                From community knowledge to practical action.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
