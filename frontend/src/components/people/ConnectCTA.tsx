"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import LinkButton from "@/components/ui/LinkButton";
import SectionHeader from "@/components/ui/SectionHeader";

type ConnectCTAProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export default function ConnectCTA({ eyebrow, title, body }: ConnectCTAProps) {
  return (
    <Box
      component="section"
      aria-labelledby="connect-heading"
      sx={{ bgcolor: "background.inverse", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="xl">
        <SectionHeader
          titleId="connect-heading"
          tone="inverse"
          eyebrow={eyebrow}
          title={title}
          intro={body}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 5 }}>
          <LinkButton href="/partner-with-us" variant="contained" color="secondary" endIcon={<EastRoundedIcon />}>
            Partner with us
          </LinkButton>
          <LinkButton
            href="mailto:partnerships@sq1ecoafrica.org"
            variant="outlined"
            sx={{ color: "common.white", borderColor: "common.white" }}
          >
            partnerships@sq1ecoafrica.org
          </LinkButton>
        </Stack>
      </Container>
    </Box>
  );
}
