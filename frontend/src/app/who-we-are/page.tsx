import Image from "next/image";
import Navbar from "@/components/navigation/Navbar";
import LinkButton from "@/components/ui/LinkButton";

import {
  Box,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import EastRounded from "@mui/icons-material/EastRounded";

import Footer from "@/components/layout/Footer";

const values = [
  {
    number: "01",
    title: "Community Agency",
    description:
      "We recognise communities as active participants in shaping the solutions that affect their lives and livelihoods.",
  },
  {
    number: "02",
    title: "Equity & Inclusion",
    description:
      "We value inclusive participation and work towards solutions that recognise different experiences, needs and opportunities.",
  },
  {
    number: "03",
    title: "Evidence & Learning",
    description:
      "We use evidence, shared learning and practical experience to inform our work and strengthen the solutions we develop.",
  },
  {
    number: "04",
    title: "Partnerships",
    description:
      "We bring people, organisations, skills and resources together to address challenges that cannot be solved in isolation.",
  },
  {
    number: "05",
    title: "Sustainability",
    description:
      "We pursue practical solutions that connect environmental responsibility with resilient communities and sustainable livelihoods.",
  },
];

const pillars = [
  {
    number: "01",
    title: "Eco-Sustainable Development",
    description:
      " Developing practical environmental and livelihood solutions with communities.",
    image: "/assets/images/community/womensmiles.jpg",
    href: "/our-focus",
    linkLabel: "Explore our focus",
  },
  {
    number: "02",
    title: "EcoTech Innovation Hubs",
    description:
      " Connecting communities to accessible innovations, climate information and digital tools.",
    image: "/assets/images/community/taarifaecoapp.webp",
    href: "/innovation",
    linkLabel: "Explore innovation",
  },
  {
    number: "03",
    title: "Eco-Storytelling & Advocacy for Transformational Impact",
    description: "Documenting progress, communicating evidence, strengthening community voices and informing wider action.",
    image: "/assets/images/community/matharedreamras.jpg",
    href: "/people-stories",
    linkLabel: "Explore our stories",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        mb: 2,
        fontFamily: '"Space Mono", monospace',
        fontSize: 10,
        letterSpacing: "0.15em",
        lineHeight: 1.8,
        textTransform: "uppercase",
        color: "#83834B",
      }}
    >
      {children}
    </Typography>
  );
}

export default function WhoWeArePage() {
  return (
    <>
      <Navbar />

      <Box component="main" sx={{ bgcolor: "#FFFFFF" }}>

        {/* INTRODUCTION / HERO */}
        <Box
          component="section"
          sx={{
            position: "relative",
            minHeight: { xs: 590, md: "76vh" },
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden",
            bgcolor: "#504624",
            color: "#FFFFFF",
          }}
        >
          <Image
            src="/assets/images/community/soeateamgirlies.jpg"
            alt="Square One Eco Africa community and team members"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(25,25,18,0.82) 0%, rgba(25,25,18,0.46) 55%, rgba(25,25,18,0.12) 100%), linear-gradient(0deg, rgba(20,20,15,0.55), transparent 65%)",
            }}
          />

          <Container
            maxWidth="xl"
            sx={{ position: "relative", zIndex: 1, pb: { xs: 7, md: 11 }, pt: 12 }}
          >
            <Box sx={{ maxWidth: 850 }}>
              <Eyebrow>
                Square One Eco Africa / Who We Are
              </Eyebrow>

              <Typography
                component="h1"
                sx={{
                  maxWidth: 850,
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: "clamp(3.5rem, 8vw, 7.2rem)",
                  fontWeight: 600,
                  lineHeight: 0.92,
                  letterSpacing: "-0.045em",
                  color: "#FFFFFF",
                }}
              >
                Developing community champions.
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    color: "#D9AF3F",
                    fontStyle: "italic",
                  }}
                >
                  Co-creating practical solutions.
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3.5,
                  maxWidth: 610,
                  fontSize: { xs: 15, md: 17 },
                  lineHeight: 1.9,
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                We bring communities, skills, partnerships and innovation
                together to address environmental challenges and build
                sustainable livelihoods.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 4 }}
              >
                <LinkButton
                  href="#our-identity"
                  variant="contained"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#D9AF3F",
                    color: "#292719",
                    px: 3,
                    py: 1.4,
                    "&:hover": { bgcolor: "#E6C45F" },
                  }}
                >
                  Discover who we are
                </LinkButton>

                <LinkButton
                  href="/people-stories"
                  variant="outlined"
                  endIcon={<EastRounded />}
                  sx={{
                    alignSelf: "flex-start",
                    borderColor: "rgba(255,255,255,0.65)",
                    color: "#FFFFFF",
                    px: 3,
                    py: 1.4,
                    "&:hover": {
                      borderColor: "#D9AF3F",
                      color: "#D9AF3F",
                    },
                  }}
                >
                  Meet our people
                </LinkButton>
              </Stack>
            </Box>
          </Container>

          <Box
            sx={{
              position: "absolute",
              right: { xs: 3, md: 7 },
              bottom: { xs: 3, md: 6 },
              fontFamily: '"Space Mono", monospace',
              fontSize: 9,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            PEOPLE. SKILLS. SOLUTIONS.
          </Box>
        </Box>

        {/* OUR IDENTITY */}
        <Box
          id="our-identity"
          component="section"
          sx={{ py: { xs: 9, md: 15 } }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={{ xs: 5, md: 9 }} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Eyebrow>01 / Our identity</Eyebrow>

                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 520,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: "clamp(2.8rem, 5vw, 4.8rem)",
                    fontWeight: 600,
                    lineHeight: 0.98,
                    letterSpacing: "-0.035em",
                    color: "#292719",
                  }}
                >
                  Practical change begins with people.
                </Typography>

                <Box
                  sx={{
                    width: 54,
                    height: 2,
                    bgcolor: "#D9AF3F",
                    my: 3.5,
                  }}
                />

                <Typography
                  sx={{
                    maxWidth: 470,
                    color: "#5F5F55",
                    fontSize: 16,
                    lineHeight: 1.95,
                  }}
                >
                  Practical change begins with people who understand their
                  communities, the challenges they face and the possibilities
                  they want to create. We bring community and grassroots
                  co-creation together with practical skills, climate
                  technology, climate-tech innovation, partnerships and
                  storytelling to turn local knowledge into climate solutions.
                  By strengthening community agency, capabilities, livelihoods
                  and local leadership, we support transformational impact that
                  people can sustain and expand on their own terms.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 340, sm: 440, md: 540 },
                    overflow: "hidden",
                    bgcolor: "#E5E5DD",
                  }}
                >
                  <Image
                    src="/assets/images/whoweare/stephmathare.jpg"
                    alt="Stephanie Ndiritu of SOEA facilitating a community meeting in Mathare"
                    fill
                    sizes="(max-width: 900px) 100vw, 58vw"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <Typography
                  sx={{
                    mt: 1.5,
                    fontFamily: '"Space Mono", monospace',
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "#77776B",
                    textTransform: "uppercase",
                  }}
                >
                  Facilitating community conversations in Mathare
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* VISION AND MISSION */}
        <Box
          component="section"
          sx={{
            py: { xs: 9, md: 12 },
            bgcolor: "#F5F5EF",
          }}
        >
          <Container maxWidth="xl">
            <Eyebrow>02 / Our direction</Eyebrow>

            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: 38, md: 52 },
                    fontWeight: 600,
                    color: "#504624",
                  }}
                >
                  Our Vision
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    maxWidth: 520,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: 27, md: 36 },
                    lineHeight: 1.25,
                    color: "#292719",
                  }}
                >
                  A climate-resilient, environmentally sustainable and
                  food-secure Africa.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: 38, md: 52 },
                    fontWeight: 600,
                    color: "#504624",
                  }}
                >
                  Our Mission
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    maxWidth: 570,
                    fontSize: { xs: 16, md: 18 },
                    lineHeight: 1.95,
                    color: "#5F5F55",
                  }}
                >
                  To co-design practical climate solutions with communities
                  through innovation, partnerships, and storytelling for
                  transformational impact.
                </Typography>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: { xs: 7, md: 10 },
                pt: 4,
                borderTop: "1px solid #DCDCCF",
              }}
            >
              <Eyebrow>Our value proposition</Eyebrow>

              <Typography
                sx={{
                  maxWidth: 1000,
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 30, md: 45 },
                  lineHeight: 1.2,
                  color: "#292719",
                }}
              >
                Co-creating with communities, we deliver{" "}
                <Box
                  component="span"
                  sx={{ color: "#83834B", fontStyle: "italic" }}
                >
                  practical climate solutions
                </Box>{" "}
                that lead to transformational impact.
              </Typography>
            </Box>
          </Container>
        </Box>

        {/* VALUES */}
        <Box
          id="values"
          component="section"
          sx={{ py: { xs: 9, md: 14 } }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Eyebrow>03 / What guides us</Eyebrow>
                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 600,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: "clamp(2.8rem, 5vw, 4.7rem)",
                    lineHeight: 0.98,
                    fontWeight: 600,
                    color: "#292719",
                  }}
                >
                  Our values shape how we work.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  sx={{
                    maxWidth: 470,
                    mt: { md: 5 },
                    color: "#5F5F55",
                    fontSize: 16,
                    lineHeight: 1.9,
                  }}
                >
                  These principles guide how we engage communities, approach
                  challenges, build relationships and pursue lasting impact.
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={0}>
              {values.map((value) => (
                <Grid
                  key={value.number}
                  size={{ xs: 12, sm: 6, md: 4 }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      minHeight: 235,
                      p: { xs: 2.5, md: 3.5 },
                      borderTop: "1px solid #E5E5DD",
                      borderRight: { sm: "1px solid #E5E5DD" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: "#A8A658",
                      }}
                    >
                      {value.number} / VALUE
                    </Typography>

                    <Typography
                      component="h3"
                      sx={{
                        mt: 3,
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: 32,
                        fontWeight: 600,
                        lineHeight: 1.1,
                        color: "#504624",
                      }}
                    >
                      {value.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 2,
                        maxWidth: 340,
                        fontSize: 13,
                        lineHeight: 1.9,
                        color: "#5F5F55",
                      }}
                    >
                      {value.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* THREE PILLARS */}
        <Box
          id="pillars"
          component="section"
          sx={{
            py: { xs: 9, md: 13 },
            bgcolor: "#F5F5EF",
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={4} sx={{ mb: 5 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Eyebrow>04 / How our work comes together</Eyebrow>
                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 680,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: "clamp(2.8rem, 5vw, 4.7rem)",
                    fontWeight: 600,
                    lineHeight: 0.98,
                    color: "#292719",
                  }}
                >
                  Three pillars. A shared purpose.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  sx={{
                    mt: { md: 4 },
                    maxWidth: 450,
                    color: "#5F5F55",
                    fontSize: 15,
                    lineHeight: 1.9,
                  }}
                >
                  Our work connects sustainable development, technology and
                  storytelling to support practical, community-centred change.
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {pillars.map((pillar) => (
                <Grid
                  key={pillar.number}
                  size={{ xs: 12, md: 4 }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      minHeight: { xs: 420, md: 510 },
                      height: "100%",
                      overflow: "hidden",
                      isolation: "isolate",
                      bgcolor: "#504624",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: { xs: 3, md: 3.5 },
                      color: "#FFFFFF",
                      transition: "transform 350ms ease",
                      "&:hover": {
                        transform: "translateY(-5px)",
                      },
                      "&:hover .pillar-image": {
                        transform: "scale(1.06)",
                      },
                    }}
                  >
                    <Box
                      className="pillar-image"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -2,
                        backgroundImage: `url("${pillar.image}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transition: "transform 650ms ease",
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -1,
                        background:
                          "linear-gradient(180deg, rgba(20,20,15,0.45) 0%, rgba(20,20,15,0.12) 35%, rgba(20,20,15,0.88) 100%)",
                      }}
                    />

                    <Typography
                      sx={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      PILLAR {pillar.number}
                    </Typography>

                    <Box>
                      <Typography
                        component="h3"
                        sx={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: { xs: 35, md: 38 },
                          fontWeight: 600,
                          lineHeight: 1.08,
                          color: "#FFFFFF",
                        }}
                      >
                        {pillar.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 2,
                          mb: 3,
                          maxWidth: 340,
                          fontSize: 13,
                          lineHeight: 1.85,
                          color: "rgba(255,255,255,0.88)",
                        }}
                      >
                        {pillar.description}
                      </Typography>

                      <Link href={pillar.href} underline="none" sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                        "&:hover": { color: "#D9AF3F" },
                      }}>
                        {pillar.linkLabel}
                        <ArrowOutwardRounded sx={{ fontSize: 17 }} />
                      </Link>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* PEOPLE AND GOVERNANCE */}
        <Box
          component="section"
          sx={{
            py: { xs: 9, md: 13 },
            bgcolor: "#FFFFFF",
          }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={5} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Eyebrow>05 / The people behind the work</Eyebrow>

                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 600,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: "clamp(2.8rem, 5vw, 4.7rem)",
                    fontWeight: 600,
                    lineHeight: 0.98,
                    color: "#292719",
                  }}
                >
                  People make the work possible.
                </Typography>

                <Typography
                  sx={{
                    mt: 3,
                    maxWidth: 500,
                    color: "#5F5F55",
                    fontSize: 15,
                    lineHeight: 1.95,
                  }}
                >
                  Behind every initiative are people contributing their
                  knowledge, skills, time and commitment. Get to know the
                  individuals and leadership supporting SOEA&rsquo;s work.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mt: 4 }}
                >
                  <LinkButton
                    href="/people-stories"
                    variant="contained"
                    endIcon={<ArrowOutwardRounded />}
                    sx={{
                      alignSelf: "flex-start",
                      bgcolor: "#83834B",
                      color: "#FFFFFF",
                      px: 3,
                      py: 1.4,
                      "&:hover": { bgcolor: "#6F703E" },
                    }}
                  >
                    Meet our team
                  </LinkButton>

                  <LinkButton
                    href="/who-we-are/governance"
                    variant="outlined"
                    endIcon={<EastRounded />}
                    sx={{
                      alignSelf: "flex-start",
                      borderColor: "#83834B",
                      color: "#504624",
                      px: 3,
                      py: 1.4,
                    }}
                  >
                    Board & governance
                  </LinkButton>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 330, md: 480 },
                    overflow: "hidden",
                    bgcolor: "#E5E5DD",
                  }}
                >
                  <Image
                    src="/assets/images/community/soeateamgirlies.jpg"
                    alt="Members of the Square One Eco Africa team"
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* FINAL CTA */}
        <Box
          component="section"
          sx={{
            mx: { xs: 1.5, md: 3 },
            mb: { xs: 1.5, md: 3 },
            py: { xs: 8, md: 11 },
            px: 3,
            bgcolor: "#504624",
            color: "#FFFFFF",
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ maxWidth: 760 }}>
              <Eyebrow>Be part of the change</Eyebrow>

              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
                  fontWeight: 600,
                  lineHeight: 0.98,
                  color: "#FFFFFF",
                }}
              >
                Better solutions begin when we work together.
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  maxWidth: 600,
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                Whether you bring expertise, resources, ideas or a shared
                commitment to community-led change, there is room to
                collaborate.
              </Typography>

              <LinkButton
                href="/partner-with-us"
                variant="contained"
                endIcon={<ArrowOutwardRounded />}
                sx={{
                  mt: 4,
                  bgcolor: "#D9AF3F",
                  color: "#292719",
                  px: 3,
                  py: 1.5,
                  "&:hover": { bgcolor: "#E6C45F" },
                }}
              >
                Partner with us
              </LinkButton>
            </Box>
          </Container>
        </Box>
      </Box>
      <Footer />
    </>
  );
}
