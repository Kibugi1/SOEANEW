import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import BackLink from "@/components/people/BackLink";
import PageIntro from "@/components/ui/PageIntro";
import StoryTimeline from "@/components/people/StoryTimeline";
import ConnectCTA from "@/components/people/ConnectCTA";
import SectionHeader from "@/components/ui/SectionHeader";
import LinkButton from "@/components/ui/LinkButton";
import { connectCopy } from "@/data/people";
import { championsIntro, featuredResource, storiesIntro } from "@/data/stories";
import { getPublicStories } from "@/lib/content/stories";

export const metadata: Metadata = {
  title: "Stories",
  description: storiesIntro.intro,
};

export default async function StoriesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          before={<BackLink href="/people-stories">People & Stories</BackLink>}
          eyebrow={storiesIntro.eyebrow}
          title={storiesIntro.title}
          intro={storiesIntro.intro}
        />

        <Box component="section" aria-labelledby="ceci-journey-heading" sx={{ pb: { xs: 10, md: 14 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={{ xs: 6, md: 10 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <SectionHeader
                  titleId="ceci-journey-heading"
                  eyebrow="Community Environmental Champions Initiative"
                  title="The CECI journey"
                  size="h3"
                />
                <Box sx={{ mt: 4, p: 3, bgcolor: "background.subtle", borderRadius: 1 }}>
                  <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                    Featured resource
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: "0.9rem", lineHeight: 1.7 }}>
                    {featuredResource.title}
                  </Typography>
                  {featuredResource.href ? (
                    <LinkButton href={featuredResource.href} variant="outlined" sx={{ mt: 2 }}>
                      Read the report
                    </LinkButton>
                  ) : (
                    <Typography sx={{ mt: 1, fontSize: "0.8rem", color: "text.secondary" }}>
                      Publication pending
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <StoryTimeline stories={await getPublicStories()} />
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box
          component="section"
          aria-labelledby="champions-heading"
          sx={{ bgcolor: "background.subtle", py: { xs: 10, md: 14 } }}
        >
          <Container maxWidth="xl">
            <SectionHeader
              titleId="champions-heading"
              eyebrow="Champion journeys"
              title={championsIntro.title}
              intro={championsIntro.body}
            />
            <Typography sx={{ mt: 4, color: "text.secondary", fontStyle: "italic" }}>
              {championsIntro.pendingNote}
            </Typography>
            <LinkButton href="/people-stories/evidence" variant="outlined" sx={{ mt: 5 }}>
              Explore the evidence library
            </LinkButton>
          </Container>
        </Box>

        <ConnectCTA {...connectCopy} />
      </main>
      <Footer />
    </>
  );
}
