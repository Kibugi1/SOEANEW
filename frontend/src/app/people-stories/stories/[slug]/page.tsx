import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import BackLink from "@/components/people/BackLink";
import SimpleMarkdown from "@/components/ui/SimpleMarkdown";
import { volunteers } from "@/data/people";
import { getPublicStories, getPublicStory } from "@/lib/content/stories";

const ROLE_LABELS: Record<string, string> = {
  hosted: "Hosted by SOEA",
  participated: "SOEA took part",
  media: "Media appearance",
  meeting: "Partner engagement",
};

/** Volunteers have profile pages; board members and others are shown as names only. */
const profileHref = (slug: string) =>
  volunteers.some((v) => v.slug === slug) ? `/people-stories/${slug}` : null;

export async function generateStaticParams() {
  const stories = await getPublicStories();
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps<"/people-stories/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicStory(slug);
  if (!result) return {};
  return { title: result.story.title, description: result.story.summary };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="eyebrow" component="h2" sx={{ color: "primary.dark", mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

async function StoryContent({ params }: { params: PageProps<"/people-stories/stories/[slug]">["params"] }) {
  const { slug } = await params;
  const result = await getPublicStory(slug);
  if (!result) notFound();
  const { story, detail } = result;
  const isEvent = story.kind === "event";
  const people = detail
    ? [
        ...detail.team.map((m) => ({ slug: m.slug, name: m.display_name, role: m.role === "lead" ? "Led" : "Supported" })),
        ...detail.authors
          .filter((a) => !detail.team.some((m) => m.slug === a.slug))
          .map((a) => ({ slug: a.slug, name: a.display_name, role: "Written by" })),
      ]
    : [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <BackLink href="/people-stories/stories">Stories</BackLink>

      <Stack direction="row" spacing={1} sx={{ mt: 4, flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
        <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
          {isEvent ? "Event" : "Story"} · {story.dateLabel}
        </Typography>
        {detail?.event?.role && <Chip size="small" variant="outlined" label={ROLE_LABELS[detail.event.role] ?? detail.event.role} />}
      </Stack>

      <Typography component="h1" variant="h2" sx={{ mt: 2, fontSize: { xs: "2.3rem", md: "3.4rem" }, lineHeight: 1.08 }}>
        {story.title}
      </Typography>

      {detail?.event && (detail.event.venue || detail.event.organiser) && (
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          {[detail.event.venue, detail.event.organiser && `Organised by ${detail.event.organiser}`].filter(Boolean).join(" · ")}
        </Typography>
      )}

      <Typography variant="lead" component="p" sx={{ mt: 3 }}>
        {story.summary}
      </Typography>

      {story.cover && (
        <Box sx={{ position: "relative", mt: 5, aspectRatio: "16 / 9", bgcolor: "background.subtle" }}>
          <Image src={story.cover.src} alt={story.cover.alt} fill sizes="(max-width: 900px) 100vw, 860px" style={{ objectFit: "cover" }} unoptimized />
        </Box>
      )}

      {detail?.body && (
        <Box sx={{ mt: 4 }}>
          <SimpleMarkdown text={detail.body} />
        </Box>
      )}

      {detail?.lessons && (
        <Section title="What we learned">
          <SimpleMarkdown text={detail.lessons} />
        </Section>
      )}

      {(detail?.next_step ?? story.nextStep) && (
        <Section title="What happens next">
          <SimpleMarkdown text={(detail?.next_step ?? story.nextStep)!} />
        </Section>
      )}

      {detail?.outcomes && (
        <Section title="Outcomes">
          <SimpleMarkdown text={detail.outcomes} />
        </Section>
      )}

      {detail && detail.gallery.length > 0 && (
        <Section title="Photos">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {detail.gallery.map((photo) => (
              <Box component="figure" key={photo.url} sx={{ m: 0 }}>
                <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "background.subtle" }}>
                  <Image src={photo.url} alt={photo.alt_text ?? ""} fill sizes="(max-width: 600px) 100vw, 430px" style={{ objectFit: "cover" }} unoptimized />
                </Box>
                {photo.caption && (
                  <Typography component="figcaption" sx={{ mt: 1, fontSize: "0.85rem", color: "text.secondary" }}>
                    {photo.caption}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Section>
      )}

      {people.length > 0 && (
        <Section title="People">
          <Stack spacing={1}>
            {people.map((person) => {
              const href = profileHref(person.slug);
              return (
                <Typography key={`${person.slug}-${person.role}`}>
                  {href ? (
                    <Link href={href} style={{ color: "#504624", fontWeight: 600 }}>
                      {person.name}
                    </Link>
                  ) : (
                    <Box component="span" sx={{ fontWeight: 600 }}>{person.name}</Box>
                  )}{" "}
                  <Box component="span" sx={{ color: "text.secondary" }}>· {person.role}</Box>
                </Typography>
              );
            })}
          </Stack>
        </Section>
      )}

      {detail && (detail.programs.length > 0 || detail.locations.length > 0) && (
        <Section title="Part of">
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {detail.programs.map((p) => (
              <Chip key={p.slug} label={p.title} component="a" href={`/programs/${p.slug}`} clickable />
            ))}
            {detail.locations.map((l) => (
              <Chip key={l.slug} label={l.name} variant="outlined" />
            ))}
          </Stack>
        </Section>
      )}

      {(detail?.video_url || detail?.social_url) && (
        <Section title="More">
          <Stack spacing={1}>
            {detail?.video_url && <Box component="a" href={detail.video_url} target="_blank" rel="noopener noreferrer" sx={{ color: "primary.dark" }}>Watch the video</Box>}
            {detail?.social_url && <Box component="a" href={detail.social_url} target="_blank" rel="noopener noreferrer" sx={{ color: "primary.dark" }}>See the post</Box>}
          </Stack>
        </Section>
      )}
    </Container>
  );
}

export default function StoryPage({ params }: PageProps<"/people-stories/stories/[slug]">) {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Box sx={{ minHeight: "100vh" }} />}>
          <StoryContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
