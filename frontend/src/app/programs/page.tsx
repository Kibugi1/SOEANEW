import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import ProgramsHero from "@/components/programs/ProgramsHero";
import FeaturedProgram from "@/components/programs/FeaturedProgram";
import ProgramsCTA from "@/components/programs/ProgramsCTA";
import MorePrograms from "@/components/programs/MorePrograms";
import { Suspense } from "react";
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
        {/* Programs published from the dashboard; streams in, never blocks the page. */}
        <Suspense fallback={null}>
          <MorePrograms />
        </Suspense>
        <ProgramsCTA />
      </main>
      <Footer />
    </>
  );
}
