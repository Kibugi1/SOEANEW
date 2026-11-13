"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import LinkButton from "@/components/ui/LinkButton";
import PersonAvatar from "@/components/ui/PersonAvatar";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import type { PersonPhoto } from "@/data/people";

type FounderLetterProps = {
  eyebrow: string;
  greeting: string;
  paragraphs: string[];
  signature: string;
  signatureTitle: string;
  photo: PersonPhoto | null;
  /** Link shown after the signature, e.g. to the volunteer team. */
  cta?: { href: string; label: string };
};

export default function FounderLetter({
  eyebrow,
  greeting,
  paragraphs,
  signature,
  signatureTitle,
  photo,
  cta,
}: FounderLetterProps) {
  return (
    <Box
      component="section"
      id="founder-letter"
      aria-labelledby="founder-letter-heading"
      sx={{ bgcolor: "background.subtle", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 6, md: 10 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 120 }, maxWidth: { xs: 280, md: "none" } }}>
              <PersonAvatar name={signature} photo={photo} decorative />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <SectionEyebrow sx={{ mb: 3 }}>{eyebrow}</SectionEyebrow>
            <Typography id="founder-letter-heading" variant="h2" sx={{ maxWidth: "18ch" }}>
              {greeting}
            </Typography>
            <Box sx={{ mt: 5, maxWidth: "68ch" }}>
              {paragraphs.map((paragraph) => (
                <Typography
                  key={paragraph.slice(0, 32)}
                  sx={{ mb: 3, color: "text.secondary", lineHeight: 1.95, fontSize: { xs: "0.95rem", md: "1.05rem" } }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Box>
            <Box sx={{ mt: 5, pt: 3, borderTop: 1, borderColor: "divider", maxWidth: "68ch" }}>
              <Typography variant="h4" component="p">
                &mdash; {signature}
              </Typography>
              <Typography variant="eyebrow" sx={{ mt: 1, color: "text.secondary" }}>
                {signatureTitle}
              </Typography>
            </Box>
            {cta && (
              <LinkButton href={cta.href} variant="contained" sx={{ mt: 5 }}>
                {cta.label}
              </LinkButton>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
