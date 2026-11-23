import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import VolunteerProfile from "@/components/people/VolunteerProfile";
import { getVolunteerBySlug, teamFunctions, volunteers } from "@/data/people";
import { programmes } from "@/data/programs";
import { getStoriesForProfile } from "@/lib/content/stories";

export function generateStaticParams() {
  return volunteers.map((person) => ({ slug: person.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/people-stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const person = getVolunteerBySlug(slug);
  if (!person) return {};

  return {
    title: `${person.name}, ${person.role}`,
    description: person.bio,
  };
}

type Params = PageProps<"/people-stories/[slug]">["params"];

/** Reads the slug, so it sits inside <Suspense> to keep navigation instant. */
async function VolunteerProfileContent({ params }: { params: Params }) {
  const { slug } = await params;
  const person = getVolunteerBySlug(slug);
  if (!person) notFound();

  const functionName =
    teamFunctions.find((group) => group.id === person.teamFunction)?.name ?? "";

  const supported = programmes
    .filter(
      (programme) =>
        programme.visibility === "published" &&
        person.programmeIds.includes(programme.id)
    )
    .map((programme) => ({
      id: programme.id,
      title: `${programme.title} (${programme.shortName})`,
      href: `/programs/${programme.slug}`,
    }));

  return (
    <VolunteerProfile
      person={person}
      functionName={functionName}
      programmes={supported}
      stories={await getStoriesForProfile(person.slug, person.id, person.programmeIds)}
    />
  );
}

export default function VolunteerProfilePage({
  params,
}: PageProps<"/people-stories/[slug]">) {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Box sx={{ minHeight: "100vh" }} />}>
          <VolunteerProfileContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
