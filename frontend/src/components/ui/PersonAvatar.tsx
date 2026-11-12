"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type PersonAvatarProps = {
  name: string;
  /** Approved portrait. When absent, an initials monogram is shown instead. */
  photo?: { src: string; alt: string } | null;
  /** "portrait" fills its container at 4:5; "circle" is a fixed-size disc. */
  shape?: "portrait" | "circle";
  /** Circle diameter in theme spacing units (8 = 64px). */
  size?: number;
  /** next/image `sizes` hint for portrait images. */
  sizes?: string;
  /** Set when the person's name is already shown next to the avatar. */
  decorative?: boolean;
  preload?: boolean;
  sx?: SxProps<Theme>;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export default function PersonAvatar({
  name,
  photo,
  shape = "portrait",
  size = 8,
  sizes = "(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw",
  decorative = false,
  preload = false,
  sx,
}: PersonAvatarProps) {
  const isCircle = shape === "circle";

  return (
    <Box
      sx={[
        (theme) => ({
          position: "relative",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: "primary.dark",
          color: "primary.contrastText",
          ...(isCircle
            ? {
                width: theme.spacing(size),
                height: theme.spacing(size),
                borderRadius: "50%",
              }
            : {
                width: "100%",
                aspectRatio: "4 / 5",
                borderRadius: 1,
              }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {photo ? (
        <Image
          src={photo.src}
          alt={decorative ? "" : photo.alt}
          fill
          sizes={isCircle ? "160px" : sizes}
          preload={preload}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <Typography
          component="span"
          variant={isCircle ? "h6" : "h2"}
          {...(decorative
            ? { "aria-hidden": true }
            : { role: "img", "aria-label": name })}
        >
          {getInitials(name)}
        </Typography>
      )}
    </Box>
  );
}
