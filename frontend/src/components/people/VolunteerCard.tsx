"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import PersonAvatar from "@/components/ui/PersonAvatar";
import type { Volunteer } from "@/data/people";

/** Directory tile: headshot (or monogram), first name, full name, short role. */
export default function VolunteerCard({ person }: { person: Volunteer }) {
  return (
    <Box
      component={Link}
      href={`/people-stories/${person.slug}`}
      sx={{
        display: "block",
        height: "100%",
        color: "inherit",
        textDecoration: "none",
        "&:hover .volunteer-avatar, &:focus-visible .volunteer-avatar": {
          transform: "scale(1.02)",
        },
        "&:hover .volunteer-cta, &:focus-visible .volunteer-cta": {
          color: "primary.dark",
          gap: 1.5,
        },
      }}
    >
      <Box sx={{ overflow: "hidden", borderRadius: 1 }}>
        <PersonAvatar
          name={person.name}
          photo={person.photo}
          decorative
          sx={{ transition: "transform 300ms ease" }}
        />
      </Box>
      <Typography variant="h4" component="p" sx={{ mt: 2.5, fontSize: "1.75rem" }}>
        {person.firstName}
      </Typography>
      <Typography component="h3" sx={{ mt: 0.5, fontWeight: 600, fontSize: "0.95rem" }}>
        {person.name}
      </Typography>
      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.6 }}>
        {person.shortRole}
      </Typography>
      <Box
        className="volunteer-cta"
        component="span"
        sx={{
          mt: 2,
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "primary.main",
          transition: "gap 200ms ease, color 200ms ease",
        }}
      >
        View profile <EastRoundedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}
