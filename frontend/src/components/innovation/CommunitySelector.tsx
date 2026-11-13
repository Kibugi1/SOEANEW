"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { AdaptableCommunity } from "@/data/innovation";

type CommunitySelectorProps = {
  communities: AdaptableCommunity[];
  selectedId: string;
  onSelect: (id: string) => void;
  labelledBy: string;
};

/** Selectable community tiles; they only illustrate adaptability. */
export default function CommunitySelector({
  communities,
  selectedId,
  onSelect,
  labelledBy,
}: CommunitySelectorProps) {
  return (
    <Box
      role="group"
      aria-labelledby={labelledBy}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gap: { xs: 2, md: 3 },
      }}
    >
      {communities.map((community) => {
        const selected = community.id === selectedId;
        return (
          <ButtonBase
            key={community.id}
            aria-pressed={selected}
            onClick={() => onSelect(community.id)}
            sx={{
              display: "block",
              textAlign: "left",
              borderRadius: 1,
              overflow: "hidden",
              border: 2,
              borderColor: selected ? "secondary.main" : "divider",
              bgcolor: selected ? "background.subtle" : "background.paper",
              transition: "border-color 200ms ease, background-color 200ms ease",
              "&:hover": { borderColor: selected ? "secondary.main" : "primary.light" },
              "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.dark", outlineOffset: 2 },
            }}
          >
            <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "divider" }}>
              <Image
                src={community.image.src}
                alt=""
                fill
                sizes="(max-width: 900px) 50vw, 25vw"
                style={{
                  objectFit: "cover",
                  filter: selected ? "none" : "grayscale(0.6)",
                  transition: "filter 200ms ease",
                }}
              />
            </Box>
            <Typography sx={{ p: 2, fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.5 }}>
              {community.name}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
