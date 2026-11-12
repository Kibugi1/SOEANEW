"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { motion, useReducedMotion } from "framer-motion";
import LinkButton from "@/components/ui/LinkButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { innovationLinks, pathwayIntro, pathwaySteps } from "@/data/innovation";

/** Six-step pathway from training champions to sustainable infrastructure. */
export default function InnovationPathway() {
  const reduceMotion = useReducedMotion();

  return (
    <Box component="section" aria-labelledby="pathway-heading" sx={{ py: { xs: 10, md: 14 } }}>
      <Container maxWidth="xl">
        <SectionHeader titleId="pathway-heading" eyebrow={pathwayIntro.eyebrow} title={pathwayIntro.title} />

        <Box
          component="ol"
          sx={{
            m: 0,
            mt: { xs: 6, md: 8 },
            p: 0,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(6, 1fr)" },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {pathwaySteps.map((step, index) => (
            <Box
              key={step}
              component={motion.li}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              sx={{
                position: "relative",
                p: 3,
                minHeight: { lg: 190 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 3,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: index === pathwaySteps.length - 1 ? "background.inverse" : "background.paper",
                color: index === pathwaySteps.length - 1 ? "common.white" : "text.primary",
              }}
            >
              <Typography variant="eyebrow" sx={{ color: index === pathwaySteps.length - 1 ? "secondary.main" : "primary.dark" }}>
                Step {String(index + 1).padStart(2, "0")}
              </Typography>
              <Typography variant="h4" component="p" sx={{ fontSize: { xs: "1.5rem", lg: "1.4rem" }, lineHeight: 1.15 }}>
                {step}
              </Typography>
              {index < pathwaySteps.length - 1 && (
                <EastRoundedIcon
                  aria-hidden
                  sx={{
                    display: { xs: "none", lg: "block" },
                    position: "absolute",
                    right: -16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    fontSize: 20,
                    color: "secondary.dark",
                    bgcolor: "background.default",
                    borderRadius: "50%",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        <Typography variant="lead" sx={{ mt: { xs: 6, md: 8 }, maxWidth: "70ch", color: "text.secondary" }}>
          {pathwayIntro.objective}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 5 }}>
          <LinkButton href={innovationLinks.ceci.href} variant="contained" endIcon={<EastRoundedIcon />}>
            {innovationLinks.ceci.label}
          </LinkButton>
          <LinkButton href={innovationLinks.investment.href} variant="outlined">
            {innovationLinks.investment.label}
          </LinkButton>
        </Stack>
      </Container>
    </Box>
  );
}
