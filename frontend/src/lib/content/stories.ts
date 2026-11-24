/**
 * Public stories for People & Stories and profile pages.
 *
 * Reads published stories from the SOEA API when one is configured
 * (CONTENT_API_BASE_URL, or NEXT_PUBLIC_API_BASE_URL) and falls back to the built-in
 * stories in src/data/stories.ts when it is not configured or not reachable, so the
 * site always renders. Results are cached for a few minutes ("use cache" with the
 * "minutes" profile), so a story approved in the dashboard appears without a redeploy.
 *
 * Only what the API's public endpoints return is used: drafts, stories in review,
 * confidential stories and stories without consent never reach these functions.
 */
import { cacheLife } from "next/cache";
import { programmes } from "@/data/programs";
import { Story, StoryMedia, getStoriesForPerson, stories as builtInStories } from "@/data/stories";

const API_BASE = (process.env.CONTENT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 5000;
const STORY_PATH = "/people-stories/stories";

interface ApiImage {
  url: string;
  alt_text: string | null;
}

interface ApiStoryListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  published_at: string;
  activity_date: string | null;
  story_type: "story" | "event";
  event: { start_date: string | null; end_date: string | null; venue: string | null; organiser: string | null; role: string | null } | null;
  authors: { slug: string; display_name: string }[];
  program: { slug: string; title: string } | null;
  locations: { slug: string; name: string }[];
  cover_image: ApiImage | null;
}

export interface ApiStoryDetail extends ApiStoryListItem {
  body: string;
  next_step: string | null;
  lessons: string | null;
  outcomes: string | null;
  video_url: string | null;
  social_url: string | null;
  programs: { slug: string; title: string }[];
  phases: { slug: string; title: string; program: { slug: string } }[];
  team: { slug: string; display_name: string; role: "lead" | "support" }[];
  gallery: (ApiImage & { caption: string | null })[];
}

/** A story ready for the page: the timeline shape plus the full detail. */
export interface PublicStory {
  story: Story;
  detail: ApiStoryDetail | null;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[content] ${path}: ${(error as Error).message}; using built-in content.`);
    throw error;
  }
}

const formatDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function dateLabel(item: ApiStoryListItem): string {
  const start = item.event?.start_date ?? item.activity_date;
  const end = item.event?.end_date;
  if (start && end && end !== start) return `${formatDay(start)} – ${formatDay(end)}`;
  if (start) return formatDay(start);
  return formatDay(item.published_at);
}

const image = (value: ApiImage | null): StoryMedia | null =>
  value ? { type: "image", src: value.url, alt: value.alt_text ?? "" } : null;

/** API story → the shape the timeline components already use. */
export function toStory(item: ApiStoryListItem | ApiStoryDetail): Story {
  const detail = "body" in item ? item : null;
  const programId = item.program ? programmes.find((p) => p.slug === item.program!.slug)?.id ?? null : null;
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    date: item.event?.start_date ?? item.activity_date,
    dateLabel: dateLabel(item),
    // Everything published describes something that has happened.
    status: "completed",
    programmeId: programId,
    community: item.locations.map((l) => l.name),
    phase: detail?.phases[0]?.title ?? "",
    linkedTeamIds: [...item.authors.map((a) => a.slug), ...(detail?.team.map((t) => t.slug) ?? [])],
    approvedPartners: [],
    summary: item.summary,
    gallery: detail ? detail.gallery.map((g) => ({ type: "image" as const, src: g.url, alt: g.alt_text ?? "" })) : [],
    attachment: null,
    nextStep: detail?.next_step ?? null,
    socialUrl: detail?.social_url ?? null,
    consentReviewed: true,
    href: `${STORY_PATH}/${item.slug}`,
    kind: item.story_type,
    cover: image(item.cover_image),
  };
}

/** Published stories and events, newest first. */
export async function getPublicStories(): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  try {
    const page = await getJson<{ data: ApiStoryListItem[] }>("/stories?per_page=50&sort=newest");
    if (page) return page.data.map(toStory);
  } catch {
    /* fall through to the built-in stories */
  }
  return builtInStories;
}

/** Stories a person wrote, led or supported (their profile page). */
export async function getStoriesForProfile(slug: string, personId: string, programmeIds: string[]): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  try {
    if (API_BASE) {
      const page = await getJson<{ data: ApiStoryListItem[] }>(`/team/${encodeURIComponent(slug)}/stories?per_page=50`);
      return page ? page.data.map(toStory) : [];
    }
  } catch {
    /* fall through */
  }
  return getStoriesForPerson(personId, programmeIds);
}

/** One published story or event with its full text, or null. */
export async function getPublicStory(slug: string): Promise<PublicStory | null> {
  "use cache";
  cacheLife("minutes");
  try {
    const result = await getJson<{ data: ApiStoryDetail }>(`/stories/${encodeURIComponent(slug)}`);
    if (result) return { story: toStory(result.data), detail: result.data };
    if (API_BASE) return null; // the API answered 404: not published
  } catch {
    /* fall through */
  }
  const builtIn = builtInStories.find((s) => s.slug === slug);
  return builtIn ? { story: builtIn, detail: null } : null;
}

/**
 * Published stories tagged with any of these places (a county and the communities in
 * it, e.g. Nairobi with Dandora and Mathare), newest first.
 */
export async function getStoriesForPlaces(slugs: string[], names: string[]): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  try {
    if (API_BASE) {
      const pages = await Promise.all(
        slugs.map((slug) => getJson<{ data: ApiStoryListItem[] }>(`/stories?location=${encodeURIComponent(slug)}&per_page=50`)),
      );
      const seen = new Set<string>();
      return pages
        .flatMap((page) => page?.data ?? [])
        .filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)))
        .sort((a, b) => b.published_at.localeCompare(a.published_at))
        .map(toStory);
    }
  } catch {
    /* fall through */
  }
  return builtInStories.filter((story) => story.community.some((place) => names.includes(place)));
}
