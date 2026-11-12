import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import BackLink from "@/components/people/BackLink";
import PageIntro from "@/components/ui/PageIntro";
import BoardGrid from "@/components/people/BoardGrid";
import FounderLetter from "@/components/people/FounderLetter";
import ConnectCTA from "@/components/people/ConnectCTA";
import { boardIntro, boardMembers, connectCopy, founderLetter } from "@/data/people";

export const metadata: Metadata = {
  title: "Board & Governance",
  description: boardIntro.intro,
};

export default function GovernancePage() {
  const founder = boardMembers.find((member) => member.id === "rozalia-wangui-karanja");

  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          before={<BackLink href="/who-we-are">Who We Are</BackLink>}
          eyebrow={boardIntro.eyebrow}
          title={boardIntro.title}
          intro={boardIntro.intro}
        />
        <BoardGrid members={boardMembers} note={boardIntro.note} />
        <FounderLetter {...founderLetter} photo={founder?.photo ?? null}
          cta={{ href: "/people-stories#team", label: "Meet the volunteer team" }}
        />
        <ConnectCTA {...connectCopy} />
      </main>
      <Footer />
    </>
  );
}

