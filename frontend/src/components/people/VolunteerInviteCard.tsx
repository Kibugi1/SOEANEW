"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { motion, useReducedMotion } from "framer-motion";

/** "This could be you" tile at the end of the volunteer grid. */
export default function VolunteerInviteCard() {
  const reduceMotion = useReducedMotion();

  return (
    <Box
      component={Link}
      href="/people-stories/volunteer"
      sx={{
        display: "block",
        height: "100%",
        color: "inherit",
        textDecoration: "none",
        "&:hover .invite-frame, &:focus-visible .invite-frame": {
          borderColor: "secondary.main",
          bgcolor: "background.subtle",
        },
        "&:hover .invite-plus, &:focus-visible .invite-plus": { transform: "rotate(90deg) scale(1.08)" },
        "&:hover .invite-cta, &:focus-visible .invite-cta": { gap: 1.5, color: "primary.dark" },
      }}
    >
      <Box
        className="invite-frame"
        sx={{
          position: "relative",
          aspectRatio: "4 / 5",
          borderRadius: 1,
          border: 2,
          borderStyle: "dashed",
          borderColor: "primary.light",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          transition: "border-color 250ms ease, background-color 250ms ease",
        }}
      >
        {/* Silhouette */}
        <Box aria-hidden sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "end center", color: "divider" }}>
          <svg viewBox="0 0 100 100" width="78%" preserveAspectRatio="xMidYMax meet">
            <circle cx="50" cy="36" r="18" fill="currentColor" />
            <path d="M14 100c0-22 16-36 36-36s36 14 36 36z" fill="currentColor" />
          </svg>
        </Box>
        <Box
          component={motion.div}
          aria-hidden
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          sx={{ position: "relative" }}
        >
          <Box
            className="invite-plus"
            sx={{
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              boxShadow: 3,
              transition: "transform 300ms ease",
            }}
          >
            <AddRoundedIcon fontSize="large" />
          </Box>
        </Box>
      </Box>
      <Typography variant="h4" component="p" sx={{ mt: 2.5, fontSize: "1.75rem" }}>
        You?
      </Typography>
      <Typography component="h3" sx={{ mt: 0.5, fontWeight: 600, fontSize: "0.95rem" }}>
        This could be you
      </Typography>
      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.6 }}>
        Volunteer with SOEA and bring your skills to community-led climate action.
      </Typography>
      <Box
        className="invite-cta"
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
        Start your volunteer journey <EastRoundedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}
