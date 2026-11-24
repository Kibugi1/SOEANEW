import OurApproach from "@/components/home/OurApproach";
import PeopleIntroduction from "@/components/home/PeopleIntroduction";
import LinkButton from "@/components/ui/LinkButton";
import LinkText from "@/components/ui/LinkText";
import Pillars from "@/components/home/Pillars";
import ThematicFocus from "@/components/home/ThematicFocus";
import ProgramsFeature from "@/components/home/ProgramsFeature";
import PartnershipCTA from "@/components/home/PartnershipCTA";

import {
  ArrowDownwardRounded,
  ArrowOutwardRounded,
  EastRounded,
  NorthEastRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Navbar from "@/components/navigation/Navbar";
import CinematicHero from "@/components/home/CinematicHero";
import EventFeature from "@/components/events/EventCountdown";
import { ceciWhatNext } from "@/data/events";

import Footer from "@/components/layout/Footer";


function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        mb: 2,
        fontFamily: '"Space Mono", monospace',
        fontSize: 10,
        letterSpacing: "0.12em",
        lineHeight: 1.8,
        textTransform: "uppercase",
        color: "primary.main",
      }}
    >
      {children}
    </Typography>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />

      <Box component="main">
        {/* Cinematic Hero */}
        <CinematicHero />

        {/* CECI: What Next? countdown. Shows until the event ends, then disappears. */}
        <EventFeature event={ceciWhatNext} />

        {/* Introduction */}
        <PeopleIntroduction />

        {/* Approach */}
        <OurApproach />

        {/* Pillars */}
        <Pillars />

        {/* Thematic focus */}
        <ThematicFocus />
        {/* Programs feature */}
        <ProgramsFeature />


        {/* Partnership CTA */}
        <PartnershipCTA />
      </Box>

      <Footer />
    </>
  );
}
