"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import PersonAvatar from "@/components/ui/PersonAvatar";
import type { BoardMember } from "@/data/people";

type BoardGridProps = {
  members: BoardMember[];
  note: string;
};

/** Full Board of Directors listing with portraits and biographies. */
export default function BoardGrid({ members, note }: BoardGridProps) {
  return (
    <Box component="section" aria-label="Board members" sx={{ pb: { xs: 10, md: 14 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 6, md: 6 }}>
          {members.map((member, index) => (
            <Grid key={member.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Box component="article" aria-labelledby={`board-${member.id}`}>
                <PersonAvatar
                  name={member.name}
                  photo={member.photo}
                  decorative
                  preload={index < 3}
                  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <Typography
                  variant="eyebrow"
                  sx={{ mt: 3, display: "block", color: "primary.dark" }}
                >
                  {member.title}
                </Typography>
                <Typography
                  id={`board-${member.id}`}
                  variant="h3"
                  component="h2"
                  sx={{ mt: 1 }}
                >
                  {member.name}
                </Typography>
                <Typography sx={{ mt: 2, color: "text.secondary", lineHeight: 1.85, fontSize: "0.95rem" }}>
                  {member.bio}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography
          sx={{
            mt: { xs: 8, md: 10 },
            pt: 3,
            borderTop: 1,
            borderColor: "divider",
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          {note}
        </Typography>
      </Container>
    </Box>
  );
}
