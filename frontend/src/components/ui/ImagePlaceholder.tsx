import { Box, Typography } from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";

/**
 * Stands in for a photo that the team still has to pick from the shared folders
 * (SOEA website feedback, 19 Nov 2026). It fills the same space as the image it
 * replaces, so the layout stays the same once the real photo is dropped in.
 *
 * To finish one: put the photo in /public/assets/images/..., then replace the
 * <ImagePlaceholder> with the page's usual <Image>, using `needed` as the basis
 * for the alt text.
 */
export interface PhotoNeeded {
  /** What the photo should show. */
  needed: string;
  /** Where to look in SOEA's shared folders. */
  source?: string;
}

export default function ImagePlaceholder({
  needed,
  source,
  compact = false,
  sx,
}: PhotoNeeded & {
  /** Smaller text for small slots (cards, thumbnails). */
  compact?: boolean;
  sx?: object;
}) {
  return (
    <Box
      role="img"
      aria-label={`Photo to be added: ${needed}`}
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: compact ? 0.75 : 1.25,
        p: compact ? 2 : { xs: 2.5, md: 4 },
        bgcolor: "#EFEDE3",
        border: "2px dashed",
        borderColor: "primary.main",
        color: "primary.dark",
        overflow: "auto",
        ...sx,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PhotoCameraOutlinedIcon fontSize={compact ? "small" : "medium"} />
        <Typography
          component="span"
          sx={{ fontFamily: '"Space Mono", monospace', fontSize: compact ? "0.62rem" : "0.72rem", letterSpacing: "0.12em", fontWeight: 700 }}
        >
          PHOTO NEEDED
        </Typography>
      </Box>
      <Typography sx={{ fontSize: compact ? "0.8rem" : { xs: "0.9rem", md: "1rem" }, lineHeight: 1.5, fontWeight: 600 }}>
        {needed}
      </Typography>
      {source && (
        <Typography sx={{ fontSize: compact ? "0.72rem" : "0.82rem", lineHeight: 1.5, color: "text.secondary" }}>
          Find in: {source}
        </Typography>
      )}
    </Box>
  );
}
