"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SectionHeader from "@/components/ui/SectionHeader";

type PageIntroProps = {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Optional content under the intro, such as a back link or actions. */
  children?: React.ReactNode;
  /** Rendered above the eyebrow, such as a breadcrumb link. */
  before?: React.ReactNode;
};

/** Top-of-page heading block shared by the People & Stories routes. */
export default function PageIntro({
  eyebrow,
  title,
  intro,
  children,
  before,
}: PageIntroProps) {
  return (
    <Box component="section" sx={{ pt: { xs: 15, md: 21 }, pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="xl">
        {before && <Box sx={{ mb: 5 }}>{before}</Box>}
        <SectionHeader
          level="h1"
          eyebrow={eyebrow}
          title={title}
          intro={intro}
          sx={{ "& h1": { maxWidth: "20ch" } }}
        />
        {children && <Box sx={{ mt: 5 }}>{children}</Box>}
      </Container>
    </Box>
  );
}
