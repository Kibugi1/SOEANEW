import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import GeoJourney from "@/components/where-we-work/GeoJourney";
import { focusCounties } from "@/data/counties";
import { getJourneyMapData } from "@/lib/geo/journeyMap";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import { whereWeWorkContent } from "@/data/whereWeWork";

const olive = "#83834B";
const gold = "#D9AF3F";
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

export default function WhereWeWorkPage() {
  const content = whereWeWorkContent;

  return (
    <>
      {/* Hero */}
      <Box
        component="section"
        sx={{
          position: "relative",
          minHeight: { xs: 570, md: 690 },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          bgcolor: "#33352B",
        }}
      >
        <Image
          src={content.hero.image}
          alt="Community and environmental work in Kenya"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(20,22,17,0.82) 0%, rgba(20,22,17,0.48) 58%, rgba(20,22,17,0.12) 100%), linear-gradient(0deg, rgba(20,22,17,0.45), transparent 65%)",
          }}
        />

        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ maxWidth: 850, py: { xs: 9, md: 13 } }}>
            <Typography
              sx={{
                fontFamily: '"Space Mono", monospace',
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: gold,
                mb: 3,
              }}
            >
              {content.hero.eyebrow}
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 54, sm: 70, md: 94 },
                lineHeight: 0.96,
                fontWeight: 500,
                color: "#FFFFFF",
                maxWidth: 820,
              }}
            >
              {content.hero.title}
            </Typography>

            <Typography
              sx={{
                mt: 3,
                color: "rgba(255,255,255,0.86)",
                fontSize: { xs: 16, md: 19 },
                lineHeight: 1.9,
                maxWidth: 680,
              }}
            >
              {content.hero.description}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Geographic introduction */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" },
              gap: { xs: 3, md: 10 },
              alignItems: "start",
            }}
          >
            <Eyebrow>01 / Our geographic footprint</Eyebrow>

            <Typography
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 34, md: 49 },
                lineHeight: 1.15,
                color: ink,
                maxWidth: 850,
              }}
            >
              Our work responds to the different environmental and livelihood
              realities communities experience across Kenya.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Interactive map: World → Africa → Kenya → Counties (feedback 19 Nov 2026, §10) */}
      <GeoJourney map={getJourneyMapData()} counties={focusCounties} />

      {/* Nairobi coordination hub */}
      <Box
        component="section"
        sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 } }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 5, md: 9 },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 320, md: 510 },
                overflow: "hidden",
                bgcolor: "#E8E8DC",
              }}
            >
              {content.coordinationHub.image ? (
                <Image
                  src={content.coordinationHub.image}
                  alt="Nairobi skyline"
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <ImagePlaceholder {...content.coordinationHub.photo} sx={{ bottom: "30%" }} />
              )}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(0deg, rgba(20,20,17,0.65), transparent 55%)",
                }}
              />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, p: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Space Mono", monospace',
                    color: gold,
                    fontSize: 11,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                  }}
                >
                  Coordination hub
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", serif',
                    color: "#FFFFFF",
                    fontSize: 42,
                  }}
                >
                  Nairobi County
                </Typography>
              </Box>
            </Box>

            <Stack spacing={3}>
              <Eyebrow>02 / Coordination hub</Eyebrow>

              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 44, md: 62 },
                  lineHeight: 1.02,
                  fontWeight: 500,
                  color: ink,
                }}
              >
                {content.coordinationHub.name}
              </Typography>

              <Typography
                sx={{
                  color: olive,
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: "0.02em",
                }}
              >
                {content.coordinationHub.label}
              </Typography>

              <Typography sx={{ color: muted, lineHeight: 1.9 }}>
                {content.coordinationHub.description}
              </Typography>

              <Box
                sx={{
                  borderTop: "1px solid #DDDDD2",
                  pt: 3,
                  mt: 1,
                }}
              >
                <Eyebrow>Confirmed community program locations</Eyebrow>
                <Typography sx={{ color: muted, mt: 1, lineHeight: 1.8 }}>
                  CECI&rsquo;s initial community engagement and program activities
                  are centred in Dandora and Mathare.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Community locations */}
      <Box component="section" sx={{ py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 6 }}>
            <Eyebrow>03 / Community locations</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 43, md: 65 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: ink,
              }}
            >
              Working alongside communities in Dandora and Mathare.
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.9 }}>
              These locations are central to WP-LIFT, CECI&rsquo;s first flagship project,
              which begins with waste pickers and practical circular economy
              learning.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {content.communityLocations.map((location, index) => (
              <Box key={location.id}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 270, md: 390 },
                    overflow: "hidden",
                    bgcolor: "#F3F3EC",
                  }}
                >
                  {location.image ? (
                    <Image
                      src={location.image}
                      alt={`Community engagement in ${location.name}`}
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    location.photo && <ImagePlaceholder {...location.photo} sx={{ bottom: "35%" }} />
                  )}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(0deg, rgba(20,20,17,0.55), transparent 60%)",
                    }}
                  />
                  <Box sx={{ position: "absolute", left: 3, bottom: 3 }}>
                    <Typography
                      sx={{
                        color: gold,
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 11,
                        letterSpacing: "0.12em",
                      }}
                    >
                      COMMUNITY LOCATION / 0{index + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Cormorant Garamond", serif',
                        color: "#FFFFFF",
                        fontSize: 43,
                      }}
                    >
                      {location.name}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  sx={{ color: muted, lineHeight: 1.85, mt: 2.5, mb: 2 }}
                >
                  {location.description}
                </Typography>

                <Button
                  component="a"
                  href={`/programs/${location.programmeSlug}`}
                  variant="text"
                  endIcon={<ArrowOutwardRounded />}
                  sx={{
                    px: 0,
                    color: olive,
                    fontWeight: 700,
                    "&:hover": { bgcolor: "transparent", color: "#504624" },
                  }}
                >
                  Explore CECI
                </Button>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Geographic focus */}
      <Box
        component="section"
        sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 } }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
              gap: { xs: 5, md: 10 },
            }}
          >
            <Stack spacing={3}>
              <Eyebrow>04 / Geographic areas of focus</Eyebrow>
              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: { xs: 43, md: 62 },
                  lineHeight: 1.02,
                  fontWeight: 500,
                  color: ink,
                }}
              >
                Beyond Nairobi County.
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>
                {content.geographicFocusDescription}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                gap: 1.5,
                alignContent: "start",
              }}
            >
              {content.geographicFocus.map((county, index) => (
                <Box
                  key={county}
                  sx={{
                    bgcolor: "#FFFFFF",
                    minHeight: 125,
                    p: { xs: 2, md: 2.5 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderBottom: "2px solid #D9AF3F",
                  }}
                >
                  <PlaceOutlined sx={{ color: olive, fontSize: 20 }} />
                  <Typography
                    sx={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: { xs: 22, md: 27 },
                      color: ink,
                      lineHeight: 1.1,
                    }}
                  >
                    {county}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography
            sx={{
              mt: 4,
              color: "#77776D",
              fontSize: 12,
              lineHeight: 1.8,
              maxWidth: 850,
            }}
          >
            Geographic areas of focus indicate the broader contexts in which
            SOEA seeks to engage. They should not be interpreted as confirmation
            of an active programme or established field office in every county.
          </Typography>
        </Container>
      </Box>

      {/* Approach */}
      <Box component="section" sx={{ py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              maxWidth: 900,
              mx: "auto",
              textAlign: "center",
            }}
          >
            <Eyebrow>{content.approach.eyebrow}</Eyebrow>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: { xs: 44, md: 68 },
                lineHeight: 1.02,
                fontWeight: 500,
                color: ink,
                mt: 2,
              }}
            >
              {content.approach.title}
            </Typography>
            <Typography
              sx={{
                color: muted,
                lineHeight: 1.9,
                maxWidth: 760,
                mx: "auto",
                mt: 3,
              }}
            >
              {content.approach.description}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                mt: 4,
                gap: 2,
                justifyContent: "center",
              }}
            >
              <Button
                component="a"
                href="/our-approach"
                variant="contained"
                endIcon={<ArrowOutwardRounded />}
                sx={{
                  bgcolor: olive,
                  "&:hover": { bgcolor: "#504624" },
                }}
              >
                Explore our approach
              </Button>
              <Button
                component="a"
                href="/programs"
                variant="outlined"
                endIcon={<ArrowOutwardRounded />}
                sx={{
                  borderColor: olive,
                  color: olive,
                  "&:hover": { borderColor: "#504624", color: "#504624" },
                }}
              >
                Explore our programmes
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
