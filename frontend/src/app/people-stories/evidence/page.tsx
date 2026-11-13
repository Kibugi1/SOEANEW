import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import BackLink from "@/components/people/BackLink";
import PageIntro from "@/components/ui/PageIntro";
import EvidenceLibrary from "@/components/people/EvidenceLibrary";
import ConnectCTA from "@/components/people/ConnectCTA";
import { connectCopy } from "@/data/people";
import { evidenceCategories, evidenceIntro, evidenceResources } from "@/data/stories";

export const metadata: Metadata = {
  title: "Evidence Library",
  description: evidenceIntro.intro,
};

export default function EvidencePage() {
  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          before={<BackLink href="/people-stories">People & Stories</BackLink>}
          eyebrow={evidenceIntro.eyebrow}
          title={evidenceIntro.title}
          intro={evidenceIntro.intro}
        />
        <EvidenceLibrary categories={evidenceCategories} resources={evidenceResources} />
        <ConnectCTA {...connectCopy} />
      </main>
      <Footer />
    </>
  );
}
