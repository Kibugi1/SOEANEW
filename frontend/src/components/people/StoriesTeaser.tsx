"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import LinkButton from "@/components/ui/LinkButton";
import SectionHeader from "@/components/ui/SectionHeader";
import StoryTimeline from "@/components/people/StoryTimeline";
import type { Story } from "@/data/stories";

type StoriesTeaserProps = {
  eyebrow: string;
  title: string;
  intro: string;
  stories: Story[];
};

/** Landing-page preview of the CECI journey, linking to stories and evidence. */
export default function StoriesTeaser({ eyebrow, title, intro, stories }: StoriesTeaserProps) {
  return (
    <Box
      component="section"
      aria-labelledby="stories-teaser-heading"
      sx={{ py: { xs: 10, md: 14 }, borderTop: 1, borderColor: "divider" }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 6, md: 10 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionHeader titleId="stories-teaser-heading" eyebrow={eyebrow} title={title} intro={intro} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 5 }}>
              <LinkButton href="/people-stories/stories" variant="contained" endIcon={<EastRoundedIcon />}>
                Follow our stories
              </LinkButton>
              <LinkButton href="/people-stories/evidence" variant="outlined">
                Explore the evidence library
              </LinkButton>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <StoryTimeline stories={stories} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
