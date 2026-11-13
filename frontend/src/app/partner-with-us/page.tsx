import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import Journey from "@/components/journey/Journey";
import SectionHeader from "@/components/ui/SectionHeader";
import LinkButton from "@/components/ui/LinkButton";

export const metadata: Metadata = {
  title: "Partner With Us",
  description:
    "Co-creating solutions. Connecting skills to opportunity. Start a partnership inquiry with Square One Eco Africa.",
};

export default function PartnerWithUsPage() {
  return (
    <>
      <Navbar />
      <main>
        <Journey
          id="partnership"
          queryPreset={{ param: "interest", field: "interests", multiple: true }}
        />

        <Box
          component="section"
          aria-labelledby="partner-context-heading"
          sx={{ bgcolor: "background.subtle", py: { xs: 10, md: 14 } }}
        >
          <Container maxWidth="xl">
            <Grid container spacing={{ xs: 6, md: 10 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionHeader
                  titleId="partner-context-heading"
                  eyebrow="09 / Partner with us"
                  title="Co-creating solutions. Connecting skills to opportunity."
                  intro="Partnerships bring together community knowledge, technical expertise, resources and opportunities for practical climate action. We collaborate with community organizations, technical institutions, businesses, researchers, financial institutions, public institutions and development partners."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: { xs: 3, md: 5 }, bgcolor: "background.paper", borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                    Current opportunity
                  </Typography>
                  <Typography variant="h3" component="h3" sx={{ mt: 1 }}>
                    CECI Phase 1
                  </Typography>
                  <Typography sx={{ mt: 1, fontWeight: 600, fontSize: "0.9rem" }}>
                    Curriculum Development & Partnerships | October 2026 – March 2027
                  </Typography>
                  <Typography sx={{ mt: 2, color: "text.secondary", lineHeight: 1.85 }}>
                    We are seeking partners to support the design of a community-centered training curriculum for waste pickers in Dandora and Mathare.
                  </Typography>
                  <LinkButton href="/programs/ceci/partnerships" variant="outlined" sx={{ mt: 3 }}>
                    See CECI partnership areas
                  </LinkButton>
                  <Typography sx={{ mt: 4, fontSize: "0.9rem" }}>
                    Prefer email?{" "}
                    <Box component="a" href="mailto:partnerships@sq1ecoafrica.org" sx={{ color: "primary.dark", fontWeight: 600 }}>
                      partnerships@sq1ecoafrica.org
                    </Box>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </main>
      <Footer />
    </>
  );
}
