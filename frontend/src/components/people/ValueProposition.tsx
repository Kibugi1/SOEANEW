"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

type ValuePropositionProps = {
  quote: string;
  closing?: string;
};

/** Dark band carrying SOEA's value proposition. */
export default function ValueProposition({ quote, closing }: ValuePropositionProps) {
  return (
    <Box
      component="section"
      aria-label="Our value proposition"
      sx={{ bgcolor: "background.inverse", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <SectionEyebrow color="secondary.main" sx={{ mb: 3 }}>
          Our value proposition
        </SectionEyebrow>
        <Typography
          component="blockquote"
          variant="h2"
          sx={{ m: 0, color: "common.white", maxWidth: "24ch" }}
        >
          &ldquo;{quote}&rdquo;
        </Typography>
        {closing && (
          <Typography
            variant="lead"
            sx={{ mt: 5, maxWidth: "62ch", color: "common.white", opacity: 0.85 }}
          >
            {closing}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
