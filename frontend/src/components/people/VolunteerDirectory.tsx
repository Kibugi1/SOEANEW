"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import SectionHeader from "@/components/ui/SectionHeader";
import VolunteerCard from "@/components/people/VolunteerCard";
import VolunteerInviteCard from "@/components/people/VolunteerInviteCard";
import type { TeamFunction, Volunteer } from "@/data/people";

type VolunteerDirectoryProps = {
  eyebrow: string;
  title: string;
  intro: string;
  teamFunctions: TeamFunction[];
  volunteers: Volunteer[];
};

/** Photographic grid of volunteers, grouped by function. */
export default function VolunteerDirectory({
  eyebrow,
  title,
  intro,
  teamFunctions,
  volunteers,
}: VolunteerDirectoryProps) {
  return (
    <Box
      component="section"
      id="team"
      aria-labelledby="team-heading"
      sx={{ py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="xl">
        <SectionHeader titleId="team-heading" eyebrow={eyebrow} title={title} intro={intro} />

        {teamFunctions.map((group) => {
          const members = volunteers.filter((person) => person.teamFunction === group.id);
          if (members.length === 0) return null;
          const headingId = `team-${group.id}`;

          return (
            <Box
              key={group.id}
              component="section"
              aria-labelledby={headingId}
              sx={{ mt: { xs: 8, md: 10 } }}
            >
              <Typography
                id={headingId}
                variant="eyebrow"
                component="h3"
                sx={{
                  pb: 2,
                  mb: 4,
                  borderBottom: 1,
                  borderColor: "divider",
                  color: "primary.dark",
                }}
              >
                {group.name}
              </Typography>
              <Grid container spacing={{ xs: 3, md: 4 }}>
                {members.map((person) => (
                  <Grid key={person.id} size={{ xs: 6, sm: 4, lg: 3 }}>
                    <VolunteerCard person={person} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}

        <Box component="section" aria-labelledby="team-join" sx={{ mt: { xs: 8, md: 10 } }}>
          <Typography
            id="team-join"
            variant="eyebrow"
            component="h3"
            sx={{ pb: 2, mb: 4, borderBottom: 1, borderColor: "divider", color: "primary.dark" }}
          >
            Join the team
          </Typography>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 6, sm: 4, lg: 3 }}>
              <VolunteerInviteCard />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
