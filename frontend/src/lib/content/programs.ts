/**
 * Public programs from the SOEA API (API_HANDOFF.md §5 and §7e).
 *
 * CECI and JEET Champions have hand-built pages (src/data/programs.ts, src/data/ceci.ts);
 * every other program published in the dashboard is listed on /programs and gets a page
 * at /programs/[slug] built from its dashboard fields. When the API is not configured or
 * not reachable these functions return nothing, so the hand-built pages still render.
 * Results are cached for a few minutes, so a newly published program appears without a
 * redeploy.
 */
import { cacheLife } from "next/cache";

const API_BASE = (process.env.CONTENT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 5000;

/** Programs whose page is hand-built. They are not repeated in the program grid. */
export const BUILT_IN_PROGRAM_SLUGS = ["ceci", "jeet-champions"];

export interface ApiImage {
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
}

export interface ApiProgram {
  id: string;
  slug: string;
  title: string;
  short_name: string | null;
  summary: string;
  status: "completed" | "in_progress" | "planned" | "coming_soon" | "in_development";
  is_featured: boolean;
  themes: { slug: string; name: string }[];
  locations: { slug: string; name: string }[];
  parent: { slug: string; title: string } | null;
  cover_image: ApiImage | null;
}

export interface ApiProgramDetail extends ApiProgram {
  body: string | null;
  start_date: string | null;
  end_date: string | null;
  lead: { slug: string; display_name: string; role_title: string | null; image: ApiImage | null } | null;
  contact_email: string | null;
  cta: { label: string; url: string | null; pending: boolean } | null;
  sub_programs: { slug: string; title: string }[];
  partners: { slug: string; name: string; website_url: string | null; logo: ApiImage | null }[];
  stories: { slug: string; title: string }[];
}

export const PROGRESS_LABELS: Record<ApiProgram["status"], string> = {
  in_development: "Concept in development",
  coming_soon: "Coming soon",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
};

async function getJson<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

/** Published programs that do not have a hand-built page, in dashboard order. */
export async function getDashboardPrograms(): Promise<ApiProgram[]> {
  "use cache";
  cacheLife("minutes");
  try {
    const payload = await getJson<{ data: ApiProgram[] }>("/programs?per_page=50");
    return (payload?.data ?? []).filter((p) => !BUILT_IN_PROGRAM_SLUGS.includes(p.slug));
  } catch (error) {
    console.warn(`[content] /programs: ${(error as Error).message}; showing built-in programs only.`);
    return [];
  }
}

export async function getDashboardProgram(slug: string): Promise<ApiProgramDetail | null> {
  "use cache";
  cacheLife("minutes");
  if (BUILT_IN_PROGRAM_SLUGS.includes(slug)) return null;
  try {
    const payload = await getJson<{ data: ApiProgramDetail }>(`/programs/${encodeURIComponent(slug)}`);
    return payload?.data ?? null;
  } catch (error) {
    console.warn(`[content] /programs/${slug}: ${(error as Error).message}`);
    return null;
  }
}
