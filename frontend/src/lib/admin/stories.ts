/** Types and labels for stories and events (API_HANDOFF.md §7f). */

export type StoryStatus = "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
export type StoryType = "story" | "event";
export type EventRole = "hosted" | "participated" | "media" | "meeting";
export type ConsentStatus = "unreviewed" | "not_required" | "confirmed" | "withdrawn";

export interface ImageRef {
  id: string;
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
}

export interface GalleryItem {
  media_id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
}

export interface StoryPermissions {
  edit: boolean;
  submit: boolean;
  approve: boolean;
  request_changes: boolean;
  unpublish: boolean;
  delete: boolean;
}

export interface AdminStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  story_type: StoryType;
  status: StoryStatus;
  activity_date: string | null;
  event_end_date: string | null;
  venue: string | null;
  organiser: string | null;
  event_role: EventRole | null;
  next_step: string | null;
  lessons: string | null;
  outcomes: string | null;
  video_url: string | null;
  social_url: string | null;
  consent_status: ConsentStatus;
  is_confidential: boolean;
  review_notes: string | null;
  cover_image: ImageRef | null;
  gallery: GalleryItem[];
  authors: { slug: string; display_name: string; status: string }[];
  team: { slug: string; display_name: string; role: "lead" | "support" }[];
  programs: { slug: string; title: string }[];
  phases: { ref: string; title: string }[];
  themes: { slug: string; name: string }[];
  locations: { slug: string; name: string }[];
  created_by: { id: string; full_name: string | null } | null;
  reviewed_by: { id: string; full_name: string | null } | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  permissions: StoryPermissions;
}

export interface PickerOptions {
  profiles: { slug: string; name: string; role_title: string }[];
  programs: { slug: string; name: string; title: string; phases: { ref: string; name: string; sequence: number }[] }[];
  themes: { slug: string; name: string }[];
  places: { slug: string; name: string; type: string }[];
}

export const STATUS_LABELS: Record<StoryStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "Waiting for review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Unpublished",
};

export const STATUS_COLORS: Record<StoryStatus, "default" | "warning" | "info" | "success" | "error"> = {
  DRAFT: "default",
  IN_REVIEW: "warning",
  CHANGES_REQUESTED: "error",
  APPROVED: "info",
  PUBLISHED: "success",
  ARCHIVED: "default",
};

export const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  hosted: "SOEA hosted it",
  participated: "SOEA took part",
  media: "Media appearance (radio, TV, online)",
  meeting: "Meeting or partner engagement",
};

export const CONSENT_LABELS: Record<ConsentStatus, { label: string; help: string }> = {
  unreviewed: {
    label: "Not yet checked",
    help: "Choose one of the options below before sending for review.",
  },
  confirmed: {
    label: "Consent confirmed",
    help: "Everyone identifiable in the text or photos has agreed to appear.",
  },
  not_required: {
    label: "Not required",
    help: "No identifiable community members, or only SOEA team and public figures in their public roles.",
  },
  withdrawn: {
    label: "Consent withdrawn",
    help: "Someone has withdrawn consent. This story cannot be published.",
  },
};

/** "23 Nov 2026" for an ISO date or timestamp; empty for null. */
export function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Turn an approved event's dates into "5–7 Oct 2026" style text. */
export function eventDates(story: Pick<AdminStory, "activity_date" | "event_end_date">): string {
  if (!story.activity_date) return "Date to confirm";
  if (!story.event_end_date || story.event_end_date === story.activity_date) return formatDate(story.activity_date);
  return `${formatDate(story.activity_date)} – ${formatDate(story.event_end_date)}`;
}
