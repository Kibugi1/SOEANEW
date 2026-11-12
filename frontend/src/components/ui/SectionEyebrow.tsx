"use client";

import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";

type SectionEyebrowProps = Omit<TypographyProps, "variant" | "color"> & {
  /** Theme palette path, e.g. "primary.dark" or "secondary.main". */
  color?: string;
};

/**
 * Small uppercase label shown above a section heading (e.g. "07 / People").
 * Defaults to the earth tone, which meets WCAG AA contrast at this size on
 * both white and subtle backgrounds.
 */
export default function SectionEyebrow({
  color = "primary.dark",
  sx,
  ...props
}: SectionEyebrowProps) {
  return (
    <Typography
      variant="eyebrow"
      sx={[{ color }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  );
}
