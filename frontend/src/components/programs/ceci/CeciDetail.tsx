import Image from "next/image";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import {
  ceciProgramme,
  ceciLearningAreas,
  ceciPathways,
  ceciPhases,
  ceciLeadership,
} from "@/data/ceci";

const olive = "#83834B";
const ink = "#1A1A1A";
const muted = "#5F5F55";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontFamily: '"Space Mono", monospace',
        fontSize: "0.68rem",
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color: olive,
      }}
    >
      {children}
    </Typography>
  );
}

export default function CeciDetail() {
  return (
    <>
      {/* Hero */}
      <Box
        component="section"
        sx={{
          bgcolor: "#F5F5EF",
          pt: { xs: 9, md: 15 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3} sx={{ maxWidth: 950 }}>
            <Eyebrow>Our programmes / CECI</Eyebrow>

            <Typography
              component="h1"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 48, sm: 64, md: 88 },
                lineHeight: 0.98,
                fontWeight: 500,
                color: ink,
              }}
            >
              {ceciProgramme.name}
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 17, md: 21 },
                color: muted,
                lineHeight: 1.8,
                maxWidth: 760,
              }}
            >
              {ceciProgramme.tagline}
            </Typography>

            <Typography sx={{ color: muted, lineHeight: 1.9, maxWidth: 800 }}>
              {ceciProgramme.introduction}
            </Typography>

            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ bgcolor: "#E8E8DC", px: 2, py: 1 }}>
                <Typography sx={{ fontSize: 13, color: "#504624" }}>
                  {ceciProgramme.currentPhase}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#E8E8DC", px: 2, py: 1 }}>
                <Typography sx={{ fontSize: 13, color: "#504624" }}>
                  {ceciProgramme.timeline}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Overview */}
      <Box component="section" sx={{ py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 5, md: 10 },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 320, md: 540 },
                overflow: "hidden",
                bgcolor: "#F3F3EC",
              }}
            >
              <Image
                src="/assets/images/community/ceciplanning.webp"
                alt="Community members taking part in CECI programme planning"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </Box>

            <Stack spacing={3}>
              <Eyebrow>01 / About the initiative</Eyebrow>
              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 40, md: 58 },
                  lineHeight: 1.04,
                  fontWeight: 500,
                  color: ink,
                }}
              >
                Community knowledge, translated into practical opportunity.
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>
                {ceciProgramme.purpose}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  pt: 2,
                  borderTop: "1px solid #E5E5DD",
                }}
              >
                <Box>
                  <Eyebrow>Initial cohort</Eyebrow>
                  <Typography
                    sx={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 42,
                      color: ink,
                    }}
                  >
                    {ceciProgramme.plannedCohort}
                  </Typography>
                  <Typography sx={{ color: muted, fontSize: 13 }}>
                    Planned champions
                  </Typography>
                </Box>
                <Box>
                  <Eyebrow>Location</Eyebrow>
                  <Typography sx={{ color: ink, mt: 1, lineHeight: 1.6 }}>
                    {ceciProgramme.location}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Learning areas */}
      <Box component="section" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 6 }}>
            <Eyebrow>02 / The learning journey</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, md: 64 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: ink,
              }}
            >
              Eight connected areas of learning.
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.8 }}>
              The first CECI curriculum brings together practical knowledge,
              personal development and the skills needed to strengthen
              environmental livelihoods.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {ceciLearningAreas.map((area, index) => (
              <Box
                key={area}
                sx={{
                  minHeight: 190,
                  p: 3,
                  bgcolor: "#FFFFFF",
                  color: ink,
                  borderTop: "2px solid #D9AF3F",
                  transition: "background-color 280ms ease, color 280ms ease, border-color 280ms ease",

                  "&:hover": {
                    bgcolor: olive,
                    color: "#FFFFFF",
                    borderTopColor: "#FFFFFF",
                  },

                  "&:hover .learning-area-number, &:hover .learning-area-title": {
                    color: "#FFFFFF",
                  },

                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12,
                    color: olive,
                    mb: 4,
                  }}
                  className="learning-area-number"
                >
                  0{index + 1}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 25,
                    lineHeight: 1.2,
                    color: ink,
                  }}
                  className="learning-area-title"
                >
                  {area}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Specialised pathways */}
      <Box component="section" sx={{ py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 6 }}>
            <Eyebrow>03 / Specialised learning pathways</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, md: 64 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: ink,
              }}
            >
              Learning through practical pathways.
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.8 }}>
              The first Nairobi pathways are being developed around three
              areas of material recovery and practical application.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {ceciPathways.map((pathway) => (
              <Box key={pathway.number}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 250, md: 320 },
                    overflow: "hidden",
                    bgcolor: "#F3F3EC",
                  }}
                >
                  <Image
                    src={pathway.image}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 12,
                    color: olive,
                    mt: 3,
                    mb: 1,
                  }}
                >
                  PATHWAY {pathway.number}
                </Typography>
                <Typography
                  component="h3"
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 32,
                    lineHeight: 1.1,
                    color: ink,
                    mb: 1.5,
                  }}
                >
                  {pathway.title}
                </Typography>
                <Typography sx={{ color: muted, lineHeight: 1.8 }}>
                  {pathway.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Programme phases */}
      <Box component="section" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 7 }}>
            <Eyebrow>04 / Programme progress</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, md: 64 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: ink,
              }}
            >
              From community grounding to practical application.
            </Typography>
          </Stack>

          <Stack spacing={0}>
            {ceciPhases.map((phase) => (
              <Box
                key={phase.number}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "100px 1fr 220px" },
                  gap: 3,
                  py: 4,
                  borderTop: "1px solid #DCDCD1",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    color: olive,
                    fontSize: 14,
                  }}
                >
                  {phase.number}
                </Typography>

                <Box>
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: { xs: 30, md: 38 },
                      color: ink,
                      lineHeight: 1.1,
                      mb: 1,
                    }}
                  >
                    {phase.title}
                  </Typography>
                  <Typography sx={{ color: muted, lineHeight: 1.8, mb: 2 }}>
                    {phase.description}
                  </Typography>
                  <Typography sx={{ color: "#504624", fontSize: 14, lineHeight: 1.8 }}>
                    {phase.evidence}
                  </Typography>
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 2,
                      py: 1,
                      bgcolor:
                        phase.status === "current"
                          ? "#E8E8DC"
                          : phase.status === "completed"
                            ? "#E6EDE3"
                            : "#ECECE8",
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "#504624" }}>
                      {phase.period}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Leadership */}
      <Box component="section" sx={{ py: { xs: 9, md: 12 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 5,
              alignItems: "center",
            }}
          >
            <Box>
              <Eyebrow>05 / Programme leadership</Eyebrow>
              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 42, md: 60 },
                  lineHeight: 1.04,
                  color: ink,
                  mt: 2,
                  mb: 3,
                }}
              >
                Guided by people committed to community-led change.
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.8 }}>
                CECI is led by a programme team, with support across internal
                systems, finance and administration, technical expertise,
                fundraising and partnerships, and communications.
              </Typography>
            </Box>

            <Box sx={{ bgcolor: "#F5F5EF", p: { xs: 3, md: 5 } }}>
              <Eyebrow>Programme lead</Eyebrow>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 40,
                  color: ink,
                  mt: 2,
                }}
              >
                {ceciLeadership.name}
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.7 }}>
                {ceciLeadership.role}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Partnership CTA */}
      <Box
        component="section"
        sx={{ bgcolor: "#504624", py: { xs: 9, md: 13 }, color: "#fff" }}
      >
        <Container maxWidth="xl">
          <Box sx={{ maxWidth: 850 }}>
            <Eyebrow>06 / Partnerships</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 42, md: 68 },
                lineHeight: 1.02,
                fontWeight: 500,
                mt: 2,
                mb: 3,
                color: "#fff",
              }}
            >
              Help shape the first Community Champions curriculum.
            </Typography>
            <Typography sx={{ color: "#E8E5D9", lineHeight: 1.9, maxWidth: 700, mb: 4 }}>
              We welcome organisations, training institutions and specialists
              who can contribute to curriculum development, practical skills,
              certification, mentorship and livelihood opportunities.
            </Typography>
            <Button
              component="a"
              href="/programs/ceci/partnerships"
              variant="contained"
              endIcon={<ArrowOutwardRounded />}
              sx={{
                bgcolor: "#D9AF3F",
                color: "#1A1A1A",
                "&:hover": { bgcolor: "#E6C45F" },
              }}
            >
              Explore partnership opportunities
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 4, textAlign: "center" }}>
        <Link href="/programs" style={{ color: olive, textDecoration: "none" }}>
          ← Back to all programmes
        </Link>
      </Box>
    </>
  );
}
