"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import BackLink from "@/components/people/BackLink";
import StoryTimeline from "@/components/people/StoryTimeline";
import PersonAvatar from "@/components/ui/PersonAvatar";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import type { Volunteer } from "@/data/people";
import type { Story } from "@/data/stories";

export type ProfileProgramme = { id: string; title: string; href: string };

type VolunteerProfileProps = {
  person: Volunteer;
  functionName: string;
  programmes: ProfileProgramme[];
  stories: Story[];
};

function ProfileSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ pt: 4, mt: 6, borderTop: 1, borderColor: "divider" }}
    >
      <Typography id={id} variant="eyebrow" component="h2" sx={{ mb: 3, color: "primary.dark" }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const pendingText = { color: "text.secondary", fontSize: "0.9rem" } as const;

/** Individual volunteer profile, fed from src/data/people.ts. */
export default function VolunteerProfile({
  person,
  functionName,
  programmes,
  stories,
}: VolunteerProfileProps) {
  return (
    <Box component="article" sx={{ pt: { xs: 15, md: 21 }, pb: { xs: 10, md: 14 } }}>
      <Container maxWidth="xl">
        <BackLink href="/people-stories#team">All team members</BackLink>

        <Grid container spacing={{ xs: 5, md: 10 }} sx={{ mt: { xs: 4, md: 6 } }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 120 }, maxWidth: { xs: 320, md: "none" } }}>
              <PersonAvatar name={person.name} photo={person.photo} preload />
              {!person.photo && (
                <Typography sx={{ mt: 1.5, fontSize: "0.75rem", color: "text.secondary" }}>
                  Approved portrait to follow.
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <SectionEyebrow>Volunteer · {functionName}</SectionEyebrow>
            <Typography variant="h1" sx={{ mt: 2 }}>
              {person.name}
            </Typography>
            <Typography sx={{ mt: 2, fontSize: { xs: "1rem", md: "1.15rem" }, fontWeight: 600 }}>
              {person.role}
            </Typography>
            <Typography variant="lead" sx={{ mt: 4, maxWidth: "66ch", color: "text.secondary" }}>
              {person.bio}
            </Typography>

            {person.email && (
              <Stack
                component="a"
                href={`mailto:${person.email}`}
                direction="row"
                spacing={1}
                sx={{ mt: 4, alignItems: "center", width: "fit-content", color: "primary.dark" }}
              >
                <MailOutlineRoundedIcon fontSize="small" />
                <span>{person.email}</span>
              </Stack>
            )}

            {person.funFact && (
              <Typography sx={{ mt: 3, fontStyle: "italic", color: "text.secondary" }}>
                Fun fact: {person.funFact}
              </Typography>
            )}

            <ProfileSection id="related-work" title="Contributions">
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                {person.relatedWork.map((item) => (
                  <Chip key={item} label={item} variant="outlined" />
                ))}
              </Stack>
            </ProfileSection>

            <ProfileSection id="programmes" title="Programs supported">
              {programmes.length > 0 ? (
                <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0, listStyle: "none" }}>
                  {programmes.map((programme) => (
                    <li key={programme.id}>
                      <Box
                        component={Link}
                        href={programme.href}
                        sx={{ color: "text.primary", fontWeight: 600, "&:hover": { color: "primary.dark" } }}
                      >
                        {programme.title}
                      </Box>
                    </li>
                  ))}
                </Stack>
              ) : (
                <Typography sx={pendingText}>
                  Supports SOEA&rsquo;s work across programs. Specific program links will be added once confirmed.
                </Typography>
              )}
            </ProfileSection>

            {person.education.length > 0 && (
              <ProfileSection id="education" title="Education">
                <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                  {person.education.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </Stack>
              </ProfileSection>
            )}

            <ProfileSection id="activities" title="Activities">
              {person.activities.length > 0 ? (
                <Stack component="ol" spacing={3} sx={{ m: 0, p: 0, listStyle: "none" }}>
                  {[...person.activities]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((activity) => (
                      <li key={`${activity.date}-${activity.title}`}>
                        <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>
                          {new Date(activity.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontWeight: 600 }}>{activity.title}</Typography>
                        <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{activity.summary}</Typography>
                      </li>
                    ))}
                </Stack>
              ) : (
                <Typography sx={pendingText}>
                  A verified activity timeline will be added here.
                </Typography>
              )}
            </ProfileSection>

            <ProfileSection id="recent-stories" title="Recent stories">
              {stories.length > 0 ? (
                <StoryTimeline stories={stories} headingLevel="h3" />
              ) : (
                <Typography sx={pendingText}>
                  Stories connected to {person.firstName}&rsquo;s work will appear here.
                </Typography>
              )}
            </ProfileSection>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
