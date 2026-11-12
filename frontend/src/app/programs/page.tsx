import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import ProgramsHero from "@/components/programs/ProgramsHero";
import FeaturedProgram from "@/components/programs/FeaturedProgram";
import ProgramsCTA from "@/components/programs/ProgramsCTA";
import { getPublishedProgrammes } from "@/data/programs";

export default function ProgramsPage() {
  const featuredProgramme = getPublishedProgrammes().find(
    (programme) => programme.featured
  );

  return (
    <>
      <Navbar />
      <main>
        <ProgramsHero />
        {featuredProgramme && (
          <FeaturedProgram programme={featuredProgramme} />
        )}
        <ProgramsCTA />
      </main>
      <Footer />
    </>
  );
}
