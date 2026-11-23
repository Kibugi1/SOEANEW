"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import AdminBrand from "./AdminBrand";

/** Centred card used by the sign-in and password screens, with the SOEA logo above it. */
export default function AuthCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="main"
      sx={{ minHeight: "100svh", display: "grid", placeItems: "center", bgcolor: "background.subtle", px: 2, py: 6 }}
    >
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 440, alignItems: "center" }}>
        <AdminBrand size={96} stacked />
        <Paper variant="outlined" sx={{ width: "100%", p: { xs: 3, sm: 5 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h4">
                {title}
              </Typography>
              {intro && <Typography sx={{ color: "text.secondary", mt: 1.5 }}>{intro}</Typography>}
            </Box>
            {children}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
