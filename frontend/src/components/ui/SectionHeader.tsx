"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

type HeadingLevel = "h1" | "h2" | "h3";

type SectionHeaderProps = {
  title: React.ReactNode;
  /** Id for the heading, so the parent section can use aria-labelledby. */
  titleId?: string;
  eyebrow?: React.ReactNode;
  intro?: React.ReactNode;
  /** Semantic heading level. Defaults to h2. */
  level?: HeadingLevel;
  /** Visual size, if it should differ from the semantic level. */
  size?: HeadingLevel;
  align?: "left" | "center";
  /** Use "inverse" on dark (background.inverse) sections. */
  tone?: "default" | "inverse";
  sx?: SxProps<Theme>;
};

export default function SectionHeader({
  title,
  titleId,
  eyebrow,
  intro,
  level = "h2",
  size,
  align = "left",
  tone = "default",
  sx,
}: SectionHeaderProps) {
  const isInverse = tone === "inverse";
  const isCentered = align === "center";

  return (
    <Stack
      spacing={3}
      sx={[
        {
          alignItems: isCentered ? "center" : "flex-start",
          textAlign: align,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {eyebrow && (
        <SectionEyebrow color={isInverse ? "secondary.main" : undefined}>
          {eyebrow}
        </SectionEyebrow>
      )}

      <Typography
        id={titleId}
        component={level}
        variant={size ?? level}
        sx={{
          maxWidth: "18ch",
          color: isInverse ? "common.white" : "text.primary",
        }}
      >
        {title}
      </Typography>

      {intro && (
        <Typography
          variant="lead"
          component="div"
          sx={{
            maxWidth: "62ch",
            color: isInverse ? "common.white" : "text.secondary",
            opacity: isInverse ? 0.85 : 1,
          }}
        >
          {intro}
        </Typography>
      )}
    </Stack>
  );
}
