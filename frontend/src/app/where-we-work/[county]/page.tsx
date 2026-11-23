import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import CountyDetail from "@/components/where-we-work/CountyDetail";
import { focusCounties } from "@/data/counties";
import { whereWeWorkContent } from "@/data/whereWeWork";
import { getCountyPageGeo } from "@/lib/geo/countyMaps";
import { getStoriesForPlaces } from "@/lib/content/stories";

export function generateStaticParams() {
  return focusCounties.map((county) => ({ county: county.slug }));
}

export async function generateMetadata({ params }: PageProps<"/where-we-work/[county]">): Promise<Metadata> {
  const { county: slug } = await params;
  const county = focusCounties.find((c) => c.slug === slug);
  if (!county) return {};
  return { title: `${county.name} County`, description: `${county.headline}. ${county.description}` };
}

/** Places whose stories belong on a county page: the county and its communities. */
function placesFor(slug: string, name: string) {
  const communities = slug === "nairobi" ? whereWeWorkContent.communityLocations : [];
  return {
    slugs: [slug, ...communities.map((c) => c.id)],
    names: [name, ...communities.map((c) => c.name)],
  };
}

async function CountyContent({ params }: { params: PageProps<"/where-we-work/[county]">["params"] }) {
  const { county: slug } = await params;
  const county = focusCounties.find((c) => c.slug === slug);
  const geo = county ? getCountyPageGeo(county.slug) : null;
  if (!county || !geo) notFound();
  const places = placesFor(county.slug, county.name);
  const stories = await getStoriesForPlaces(places.slugs, places.names);
  return <CountyDetail county={county} geo={geo} stories={stories} />;
}

export default function CountyPage({ params }: PageProps<"/where-we-work/[county]">) {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Box sx={{ minHeight: "100vh" }} />}>
          <CountyContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
