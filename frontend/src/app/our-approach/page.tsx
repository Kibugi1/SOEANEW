import Navbar from "@/components/navigation/Navbar";
import ApproachHero from "@/components/approach/ApproachHero";
import ChampionsJourney from "@/components/approach/ChampionsJourney";
import ChampionsPathway from "@/components/approach/ChampionsPathway";
import SixStageMethodology from "@/components/approach/SixStageMethodology";
import CommunityPathways from "@/components/approach/CommunityPathways";
import Footer from "@/components/layout/Footer";

export default function OurApproachPage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Introduction */}
        <ApproachHero />

        {/* Illustrated six-stage community journey */}
        <ChampionsJourney />

        {/* The seven-step SOEA Champions Pathway and outcomes */}
        <ChampionsPathway />

        {/* Detailed, interactive methodology */}
        <SixStageMethodology />

        {/* One methodology, adapted to different community pathways */}
        <CommunityPathways />
      </main>
      <Footer />
    </>
  );
}