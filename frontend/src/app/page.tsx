import OurApproach from "@/components/home/OurApproach";
import PeopleIntroduction from "@/components/home/PeopleIntroduction";
import LinkButton from "@/components/ui/LinkButton";
import LinkText from "@/components/ui/LinkText";
import {
  ArrowDownwardRounded,
  ArrowOutwardRounded,
  EastRounded,
  NorthEastRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Navbar from "@/components/navigation/Navbar";
import CinematicHero from "@/components/home/CinematicHero";

const steps = [
  {
    number: "01",
    title: "Listen & understand",
    description:
      "Start with the lived experiences, priorities and aspirations of communities.",
  },
  {
    number: "02",
    title: "Assess together",
    description:
      "Understand local challenges, resources and opportunities collaboratively.",
  },
  {
    number: "03",
    title: "Co-design",
    description:
      "Shape practical responses with the people who will bring them to life.",
  },
  {
    number: "04",
    title: "Train & equip",
    description:
      "Build the skills, knowledge and capabilities needed to take action.",
  },
  {
    number: "05",
    title: "Connect to opportunity",
    description:
      "Create pathways to partnerships, markets and sustainable livelihoods.",
  },
  {
    number: "06",
    title: "Follow through",
    description:
      "Learn from implementation, track progress and strengthen what works.",
  },
];

const pillars = [
  {
    number: "01",
    title: "Eco-Sustainable Development",
    description:
      "Community-centred responses that connect environmental sustainability with practical livelihood opportunities.",
    href: "/our-focus",
    tone: "#F3F3E9",
    symbol: "↗",
  },
  {
    number: "02",
    title: "Eco-Tech Innovation Hubs",
    description:
      "Exploring how technology, skills and local innovation can help communities respond to environmental challenges.",
    href: "/innovation",
    tone: "#F7F0DA",
    symbol: "⌘",
  },
  {
    number: "03",
    title: "Eco-Storytelling & Advocacy",
    description:
      "Making community experiences, practical knowledge and climate solutions more visible through storytelling.",
    href: "/people-stories",
    tone: "#F1F0E9",
    symbol: "↗",
  },
];

const themes = [
  "Circular economy & waste",
  "Gender-responsive climate resilience",
  "Climate-smart agriculture & agroforestry",
  "Blue economy & coastal resilience",
  "Just & equitable energy transition",
  "Climate technology, data & early warning",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        mb: 2,
        fontFamily: '"Space Mono", monospace',
        fontSize: 10,
        letterSpacing: "0.12em",
        lineHeight: 1.8,
        textTransform: "uppercase",
        color: "primary.main",
      }}
    >
      {children}
    </Typography>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      <Box component="main">
        {/* Cinematic Hero */}
        <CinematicHero />

        {/* Introduction */}
        <PeopleIntroduction />

        {/* Approach */}
        <OurApproach />





        {/* Pillars */}
        <Container maxWidth="xl">
          <Box sx={{ py: { xs: 9, md: 13 } }}>
            <Grid container spacing={4} sx={{ mb: 5 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Eyebrow>03 / What guides our work</Eyebrow>
                <Typography
                  component="h2"
                  variant="h2"
                  sx={{ fontSize: { xs: 43, md: 60, lg: 68 }, maxWidth: 680 }}
                >
                  Three pillars. A shared purpose.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  sx={{ color: "text.secondary", lineHeight: 1.8, maxWidth: 460 }}
                >
                  Our work connects sustainable development, technology and
                  storytelling to support practical, community-centred change.
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {pillars.map((pillar) => (
                <Grid key={pillar.number} size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      height: "100%",
                      minHeight: 340,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      p: { xs: 3, md: 3.5 },
                      bgcolor: pillar.tone,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{  width: "100%", mb: 7, alignItems: "center", justifyContent: "space-between" }}
                    >
                      <Typography
                        sx={{
                          fontFamily: '"Space Mono", monospace',
                          fontSize: 11,
                          color: "text.secondary",
                        }}
                      >
                        PILLAR {pillar.number}
                      </Typography>
                      <Typography
                        aria-hidden="true"
                        sx={{
                          fontSize: 28,
                          color: "primary.dark",
                        }}
                      >
                        {pillar.symbol}
                      </Typography>
                    </Stack>

                    <Typography
                      component="h3"
                      sx={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: { xs: 31, md: 35 },
                        lineHeight: 1.08,
                        fontWeight: 600,
                        maxWidth: 300,
                      }}
                    >
                      {pillar.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 2,
                        mb: 3,
                        fontSize: 13,
                        lineHeight: 1.85,
                        color: "text.secondary",
                      }}
                    >
                      {pillar.description}
                    </Typography>

                    <Box sx={{ mt: "auto" }}>
                      <LinkButton
                        href={pillar.href}
                        variant="text"
                        endIcon={<EastRounded />}
                        sx={{ px: 0 }}
                      >
                        Learn more
                      </LinkButton>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* Thematic focus */}
        <Box
          component="section"
          sx={{
            bgcolor: "#504624",
            color: "#FFFFFF",
            py: { xs: 9, md: 13 },
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Eyebrow>04 / Our focus</Eyebrow>
                <Typography
                  component="h2"
                  variant="h2"
                  sx={{
                    fontSize: { xs: 44, md: 60, lg: 68 },
                    maxWidth: 470,
                    color: "#FFFFFF",
                  }}
                >
                  Connected challenges. Practical responses.
                </Typography>
                <Typography
                  sx={{
                    mt: 3,
                    maxWidth: 430,
                    color: "rgba(255,255,255,0.74)",
                    lineHeight: 1.85,
                  }}
                >
                  We work across interconnected environmental and livelihood
                  themes, recognising that local challenges rarely exist in
                  isolation.
                </Typography>
                <LinkButton
                  href="/our-focus"
                  variant="contained"
                  color="secondary"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{ mt: 3, color: "#1A1A1A" }}
                >
                  Explore our focus areas
                </LinkButton>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Stack>
                  {themes.map((item, index) => (
                    <Box
                      key={item}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 2.3,
                        borderBottom: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <Typography
                        sx={{
                          width: 34,
                          flexShrink: 0,
                          fontFamily: '"Space Mono", monospace',
                          fontSize: 11,
                          color: "#D9AF3F",
                        }}
                      >
                        0{index + 1}
                      </Typography>
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: { xs: 15, md: 18 },
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </Typography>
                      <EastRounded sx={{ fontSize: 18, color: "#D9AF3F" }} />
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Programs feature */}
        <Container maxWidth="xl">
          <Box sx={{ py: { xs: 9, md: 13 } }}>
            <Grid container spacing={4} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Eyebrow>05 / Programs</Eyebrow>
                <Typography
                  component="h2"
                  variant="h2"
                  sx={{ fontSize: { xs: 44, md: 61, lg: 70 }, maxWidth: 680 }}
                >
                  Turning learning into practical action.
                </Typography>
                <Typography
                  sx={{
                    mt: 3,
                    maxWidth: 600,
                    color: "text.secondary",
                    lineHeight: 1.9,
                  }}
                >
                  Explore the Community Eco-Circular Initiative (CECI), SOEA's
                  cross-thematic initiative connecting environmental learning,
                  practical skills and livelihood opportunities.
                </Typography>
                <LinkButton
                  href="/programs/ceci"
                  variant="contained"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{ mt: 3 }}
                >
                  Discover CECI
                </LinkButton>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    p: { xs: 3, md: 4 },
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#F7F7F1",
                  }}
                >
                  <Eyebrow>Featured initiative</Eyebrow>
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 38,
                      lineHeight: 1.05,
                      fontWeight: 600,
                    }}
                  >
                    Community Eco-Circular Initiative
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2,
                      fontSize: 13,
                      color: "text.secondary",
                      lineHeight: 1.8,
                    }}
                  >
                    CECI connects circular-economy learning with practical
                    pathways around waste, recovery, skills and livelihoods.
                  </Typography>
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 10,
                        color: "primary.main",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Initial implementation focus
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 14 }}>
                      Dandora & Mathare, Nairobi
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>

        {/* Partnership CTA */}
        <Box
          component="section"
          sx={{
            mx: { xs: 1.5, md: 3 },
            mb: { xs: 1.5, md: 3 },
            bgcolor: "#D9AF3F",
          }}
        >
          <Container maxWidth="xl">
            <Grid
              container
              spacing={3}
              sx={{  py: { xs: 6, md: 9 }, alignItems: "center" }}
            >
              <Grid size={{ xs: 12, md: 8 }}>
                <Eyebrow>06 / Partner with us</Eyebrow>
                <Typography
                  component="h2"
                  variant="h2"
                  sx={{
                    fontSize: { xs: 43, md: 61, lg: 70 },
                    maxWidth: 760,
                    color: "#1A1A1A",
                  }}
                >
                  Better solutions begin when we work together.
                </Typography>
                <Typography
                  sx={{
                    mt: 2,
                    maxWidth: 590,
                    color: "#504624",
                    lineHeight: 1.8,
                  }}
                >
                  Connect with SOEA to explore collaboration, shared learning
                  and opportunities to support community-centred climate
                  solutions.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <LinkButton
                  href="/partner-with-us"
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{
                    minHeight: 54,
                    px: 3,
                    bgcolor: "#504624",
                    alignSelf: { md: "flex-end" },
                    "&:hover": { bgcolor: "#38321A" },
                  }}
                >
                  Start a conversation
                </LinkButton>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#FFFFFF",
          borderTop: "1px solid",
          borderColor: "divider",
          pt: 6,
          pb: 3,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: 33,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                square one
              </Typography>
              <Typography
                sx={{
                  mt: 0.7,
                  fontFamily: '"Space Mono", monospace',
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                Eco Africa
              </Typography>
              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 360,
                  color: "text.secondary",
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                Co-creating practical climate solutions for transformational
                impact.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Eyebrow>Explore</Eyebrow>
              <Stack spacing={1.5}>
                {[
                  ["Who We Are", "/who-we-are"],
                  ["Our Approach", "/our-approach"],
                  ["Our Focus", "/our-focus"],
                  ["Programs", "/programs"],
                  ["People & Stories", "/people-stories"],
                ].map(([label, href]) => (
                  <LinkText
                    key={href}
                    href={href}
                    sx={{
                      fontSize: 13,
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {label}
                  </LinkText>
                ))}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Eyebrow>Get in touch</Eyebrow>
              <Stack spacing={1.5}>
                <Typography
                  component="a"
                  href="mailto:info@sq1ecoafrica.org"
                  sx={{ fontSize: 13, width: "fit-content" }}
                >
                  info@sq1ecoafrica.org
                </Typography>
                <Typography
                  component="a"
                  href="mailto:partnerships@sq1ecoafrica.org"
                  sx={{ fontSize: 13, width: "fit-content" }}
                >
                  partnerships@sq1ecoafrica.org
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  Nairobi, Kenya
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 6,
              pt: 2.5,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              © 2026 Square One Eco Africa
            </Typography>
            <Stack direction="row" spacing={2.5}>
              <LinkText
                href="/privacy"
                sx={{ fontSize: 11, color: "text.secondary" }}
              >
                Privacy
              </LinkText>
              <LinkText
                href="/contact"
                sx={{ fontSize: 11, color: "text.secondary" }}
              >
                Contact
              </LinkText>
            </Stack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
