/** Types and labels for programs (API_HANDOFF.md §7e). */

export type PublicationStatus = "draft" | "published" | "archived";
export type ProgressStatus = "completed" | "in_progress" | "planned" | "coming_soon" | "in_development";

export interface AdminProgram {
  id: string;
  slug: string;
  title: string;
  short_name: string | null;
  summary: string;
  body: string | null;
  status: ProgressStatus;
  is_featured: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  publication_status: PublicationStatus;
  parent: { slug: string; title: string } | null;
  sub_programs: { slug: string; title: string }[];
  lead: { slug: string; display_name: string; status: string } | null;
  contact_email: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_pending: boolean;
  themes: { slug: string; name: string }[];
  primary_theme: string | null;
  locations: { slug: string; name: string }[];
  partners: { slug: string; name: string }[];
  created_at: string;
  updated_at: string;
}

/** The progress badge visitors see on the website. */
export const PROGRESS_LABELS: Record<ProgressStatus, string> = {
  in_development: "Concept in development",
  coming_soon: "Coming soon",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
};

export const PUBLICATION_LABELS: Record<PublicationStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const PUBLICATION_HELP: Record<PublicationStatus, string> = {
  draft: "Only visible here in the dashboard.",
  published: "Live on the website.",
  archived: "Taken off the website, kept here for the record.",
};

export const PUBLICATION_COLORS: Record<PublicationStatus, "default" | "success" | "warning"> = {
  draft: "default",
  published: "success",
  archived: "warning",
};
