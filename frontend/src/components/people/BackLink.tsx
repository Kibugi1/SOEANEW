"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        fontSize: "0.85rem",
        color: "text.secondary",
        textDecoration: "none",
        "&:hover": { color: "primary.dark" },
      }}
    >
      <ArrowBackRoundedIcon fontSize="small" />
      {children}
    </Box>
  );
}
