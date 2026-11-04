import OurApproach from "@/components/home/OurApproach";
import PeopleIntroduction from "@/components/home/PeopleIntroduction";
import LinkButton from "@/components/ui/LinkButton";
import LinkText from "@/components/ui/LinkText";
import Pillars from "@/components/home/Pillars";
import ThematicFocus from "@/components/home/ThematicFocus";
import ProgramsFeature from "@/components/home/ProgramsFeature";
import PartnershipCTA from "@/components/home/PartnershipCTA";

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
        <Pillars />

        {/* Thematic focus */}
        <ThematicFocus />
        {/* Programs feature */}
        <ProgramsFeature />


        {/* Partnership CTA */}
        <PartnershipCTA />
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
