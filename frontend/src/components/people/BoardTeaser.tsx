"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import LinkButton from "@/components/ui/LinkButton";
import PersonAvatar from "@/components/ui/PersonAvatar";
import SectionHeader from "@/components/ui/SectionHeader";
import type { BoardMember } from "@/data/people";

type BoardTeaserProps = {
  members: BoardMember[];
  note: string;
};

/** Short board summary; the full board and founder letter live on /who-we-are/governance. */
export default function BoardTeaser({ members, note }: BoardTeaserProps) {
  return (
    <Box
      component="section"
      aria-labelledby="board-teaser-heading"
      sx={{ bgcolor: "background.subtle", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionHeader
              titleId="board-teaser-heading"
              eyebrow="Board & Governance"
              title="Guided by a five-member Board"
              intro={`The Board provides governance, strategic oversight and institutional stewardship. ${note}`}
            />
            <LinkButton
              href="/who-we-are/governance"
              variant="outlined"
              endIcon={<EastRoundedIcon />}
              sx={{ mt: 5 }}
            >
              Meet the Board & read the founder&rsquo;s letter
            </LinkButton>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack component="ul" spacing={2.5} sx={{ m: 0, p: 0, listStyle: "none" }}>
              {members.map((member) => (
                <Stack
                  key={member.id}
                  component="li"
                  direction="row"
                  spacing={2.5}
                  sx={{ alignItems: "center" }}
                >
                  <PersonAvatar
                    name={member.name}
                    photo={member.photo}
                    shape="circle"
                    size={8}
                    decorative
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{member.name}</Typography>
                    <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>
                      {member.title}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
