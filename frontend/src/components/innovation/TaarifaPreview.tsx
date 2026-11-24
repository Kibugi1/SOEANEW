"use client";

import { useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import LinkButton from "@/components/ui/LinkButton";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import LayerDiagram from "@/components/innovation/LayerDiagram";
import CommunitySelector from "@/components/innovation/CommunitySelector";
import {
  adaptabilityCopy,
  adaptableCommunities,
  innovationLinks,
  taarifa,
  taarifaLayers,
} from "@/data/innovation";

/** "Coming Soon" preview of Taarifa Eco: concept summary, layers, adaptability. */
export default function TaarifaPreview() {
  const [selectedId, setSelectedId] = useState(adaptableCommunities[0].id);
  const selected =
    adaptableCommunities.find((community) => community.id === selectedId) ??
    adaptableCommunities[0];

  return (
    <Box
      component="section"
      id="taarifa-eco"
      aria-labelledby="taarifa-heading"
      sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.subtle" }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 6, md: 10 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
              <SectionEyebrow>EcoTech Innovation Hubs</SectionEyebrow>
              <Chip label={taarifa.status} color="secondary" size="small" sx={{ fontWeight: 600 }} />
            </Stack>
            <Typography id="taarifa-heading" variant="h2" sx={{ mt: 3 }}>
              {taarifa.name}
            </Typography>
            <Typography variant="lead" sx={{ mt: 2, fontWeight: 600, color: "text.primary" }}>
              {taarifa.tagline}
            </Typography>
            {taarifa.description.map((paragraph) => (
              <Typography key={paragraph.slice(0, 24)} sx={{ mt: 2.5, color: "text.secondary", lineHeight: 1.9, maxWidth: "62ch" }}>
                {paragraph}
              </Typography>
            ))}
            <Typography sx={{ mt: 3, fontSize: "0.85rem", color: "primary.dark", fontWeight: 600 }}>
              {taarifa.statusNote}
            </Typography>

            <Box sx={{ position: "relative", mt: 5, aspectRatio: "16 / 10", borderRadius: 1, overflow: "hidden", bgcolor: "divider" }}>
              <Image
                src={taarifa.image.src}
                alt={taarifa.image.alt}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
              <LayerDiagram layers={taarifaLayers} communityName={selected.name} />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 8, md: 12 } }}>
          <Typography id="adaptability-heading" variant="h3" component="h3">
            {adaptabilityCopy.title}
          </Typography>
          <Typography sx={{ mt: 2, mb: 4, color: "text.secondary", lineHeight: 1.9, maxWidth: "70ch" }}>
            {adaptabilityCopy.body}
          </Typography>
          <CommunitySelector
            communities={adaptableCommunities}
            selectedId={selectedId}
            onSelect={setSelectedId}
            labelledBy="adaptability-heading"
          />
        </Box>

        <Box sx={{ mt: { xs: 8, md: 10 }, pt: 4, borderTop: 1, borderColor: "divider" }}>
          <Typography sx={{ fontWeight: 600 }}>
            Coming soon: <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>{taarifa.comingSoon}</Box>
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
            <LinkButton href={innovationLinks.followUpdates.href} variant="contained" endIcon={<EastRoundedIcon />}>
              {innovationLinks.followUpdates.label}
            </LinkButton>
            <LinkButton href={innovationLinks.climateInnovation.href} variant="outlined">
              {innovationLinks.climateInnovation.label}
            </LinkButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
