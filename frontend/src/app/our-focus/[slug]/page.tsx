import { notFound } from "next/navigation";
import {
  Box,
  Container,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import { focusAreas } from "@/data/focusAreas";

export function generateStaticParams() {
  return focusAreas.map((area) => ({ slug: area.slug }));
}

export default async function FocusAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = focusAreas.find((item) => item.slug === slug);

  if (!area) notFound();

  return (
    <>
      <Navbar />
      <main>
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 540, md: 650 },
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden",
            bgcolor: "#504624",
            backgroundImage: `url("${area.image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(20,20,17,0.88), rgba(20,20,17,0.35))",
            },
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              position: "relative",
              zIndex: 1,
              pb: { xs: 7, md: 10 },
              pt: 18,
              color: "#FFFFFF",
            }}
          >
            <Box
              component="a"
              href="/our-focus"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                color: "#FFFFFF",
                textDecoration: "none",
                mb: 6,
                fontSize: "0.85rem",
                "&:hover": { color: "#D9AF3F" },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
              All focus areas
            </Box>

            <Typography
              sx={{
                color: "#D9AF3F",
                fontFamily: "Space Mono, monospace",
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                mb: 3,
              }}
            >
              OUR FOCUS / {area.number}
            </Typography>

            <Typography
              component="h1"
              sx={{
                maxWidth: 950,
                fontFamily: "Cormorant Garamond, serif",
                fontSize: { xs: "3.2rem", sm: "4.5rem", md: "6rem" },
                fontWeight: 600,
                lineHeight: 0.98,
              }}
            >
              {area.title}
            </Typography>
          </Container>
        </Box>

        <Box sx={{ py: { xs: 9, md: 13 } }}>
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
                gap: { xs: 6, md: 12 },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#83834B",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    mb: 3,
                  }}
                >
                  THE FOCUS
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: { xs: "2.2rem", md: "3.2rem" },
                    lineHeight: 1.18,
                    color: "#1A1A1A",
                  }}
                >
                  {area.description}
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#83834B",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    mb: 3,
                  }}
                >
                  PEOPLE WE WORK WITH
                </Typography>

                <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none" }}>
                  {area.peopleServed.map((person) => (
                    <Box
                      component="li"
                      key={person}
                      sx={{
                        py: 2,
                        borderBottom: "1px solid #E5E5DD",
                        color: "#1A1A1A",
                        lineHeight: 1.6,
                      }}
                    >
                      {person}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        <Box sx={{ bgcolor: "#F7F7F2", py: { xs: 8, md: 11 } }}>
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box sx={{ bgcolor: "#FFFFFF", p: { xs: 3, md: 5 } }}>
                <Typography
                  sx={{
                    color: "#83834B",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    mb: 3,
                  }}
                >
                  CECI LEARNING TRACK
                </Typography>
                <Typography
                  sx={{
                    color: "#1A1A1A",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                  }}
                >
                  {area.learningTrack}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: "#FFFFFF", p: { xs: 3, md: 5 } }}>
                <Typography
                  sx={{
                    color: "#83834B",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    mb: 3,
                  }}
                >
                  RELATED EVIDENCE
                </Typography>
                <Typography
                  sx={{
                    color: "#1A1A1A",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                  }}
                >
                  {area.evidence}
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>

        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Container maxWidth="xl">
            <Box
              component="a"
              href="/our-approach"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                color: "#504624",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { color: "#83834B" },
              }}
            >
              Explore how we work
              <ArrowOutwardRoundedIcon />
            </Box>
          </Container>
        </Box>
      </main>
      <Footer />
    </>
  );
}
