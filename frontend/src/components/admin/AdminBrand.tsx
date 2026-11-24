import Image from "next/image";
import { Box, Typography } from "@mui/material";

/** The SOEA logo with the same two-line wordmark as the public navbar. */
export default function AdminBrand({
  size = 48,
  stacked = false,
  showName = true,
}: {
  /** Logo width and height in pixels. */
  size?: number;
  /** Logo above the name, centred (sign-in screen) instead of side by side. */
  stacked?: boolean;
  showName?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        alignItems: "center",
        gap: stacked ? 1.5 : 1.25,
        textAlign: stacked ? "center" : "left",
      }}
    >
      <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <Image
          src="/assets/brand/soealogo.svg"
          alt={showName ? "" : "Square One Eco Africa"}
          fill
          priority
          sizes={`${size}px`}
          style={{ objectFit: "contain" }}
        />
      </Box>
      {showName && (
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: stacked ? 15 : 13,
            letterSpacing: "0.025em",
            lineHeight: 1.3,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: "text.primary",
          }}
        >
          Square One
          <Box component="span" sx={{ display: "block", fontWeight: 400 }}>
            Eco Africa
          </Box>
        </Typography>
      )}
    </Box>
  );
}
