import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import PageIntro from "@/components/ui/PageIntro";
import TaarifaPreview from "@/components/innovation/TaarifaPreview";
import InnovationPathway from "@/components/innovation/InnovationPathway";
import { innovationIntro } from "@/data/innovation";

export const metadata: Metadata = {
  title: "Innovation",
  description: innovationIntro.intro,
};

export default function InnovationPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          eyebrow={innovationIntro.eyebrow}
          title={innovationIntro.title}
          intro={innovationIntro.intro}
        />
        <TaarifaPreview />
        <InnovationPathway />
      </main>
      <Footer />
    </>
  );
}
