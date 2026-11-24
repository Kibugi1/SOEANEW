import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import PageIntro from "@/components/ui/PageIntro";
import ValueProposition from "@/components/people/ValueProposition";
import VolunteerDirectory from "@/components/people/VolunteerDirectory";
import BoardTeaser from "@/components/people/BoardTeaser";
import StoriesTeaser from "@/components/people/StoriesTeaser";
import ConnectCTA from "@/components/people/ConnectCTA";
import {
  boardIntro,
  boardMembers,
  connectCopy,
  peopleIntro,
  teamFunctions,
  teamIntro,
  volunteers,
} from "@/data/people";
import { storiesIntro } from "@/data/stories";
import { getPublicStories } from "@/lib/content/stories";

export const metadata: Metadata = {
  title: "People & Stories",
  description:
    "Meet the Board and volunteer team behind Square One Eco Africa, and follow the stories and evidence from our community programs.",
};

export default async function PeopleStoriesPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          eyebrow={peopleIntro.eyebrow}
          title={peopleIntro.title}
          intro={peopleIntro.intro}
        />
        <ValueProposition
          quote={peopleIntro.valueProposition}
          closing={peopleIntro.closing}
        />
        <VolunteerDirectory
          eyebrow={teamIntro.eyebrow}
          title={teamIntro.title}
          intro={teamIntro.intro}
          teamFunctions={teamFunctions}
          volunteers={volunteers}
        />
        <BoardTeaser members={boardMembers} note={boardIntro.note} />
        <StoriesTeaser
          eyebrow={storiesIntro.eyebrow}
          title={storiesIntro.title}
          intro="From community grounding in Dandora and Mathare to the first training curriculum, we document each step of the CECI journey."
          stories={(await getPublicStories()).slice(0, 3)}
        />
        <ConnectCTA {...connectCopy} />
      </main>
      <Footer />
    </>
  );
}
