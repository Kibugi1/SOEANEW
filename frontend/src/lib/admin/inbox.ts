/** Types and labels for the admin inbox (API_HANDOFF.md §6 and §7b). */

import { journeys } from "@/components/journey/journeys";
import type { JourneyConfig } from "@/components/journey/types";

export type EnquiryKind = "partnership" | "volunteer" | "contact";
export type EnquiryInbox = "partnerships" | "volunteers" | "info";
export type EnquiryStatus = "new" | "in_review" | "contacted" | "closed";

export interface Assignee {
  id: string;
  full_name: string | null;
  email: string;
}

export interface EnquirySummary {
  id: string;
  reference: string | null;
  kind: EnquiryKind;
  inbox: EnquiryInbox;
  topic: string | null;
  status: EnquiryStatus;
  name: string;
  organization: string | null;
  email: string;
  assigned_to: Assignee | null;
  created_at: string;
}

export interface EnquiryDetail extends EnquirySummary {
  phone: string | null;
  partnership_category: string | null;
  experience_resources: string | null;
  message: string | null;
  details: Record<string, string | string[]>;
  source_page: string | null;
  consent: boolean;
  internal_notes: string | null;
  status_changed_at: string | null;
  updated_at: string;
}

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  in_review: "Being reviewed",
  contacted: "Contacted",
  closed: "Closed",
};

export const STATUS_HELP: Record<EnquiryStatus, string> = {
  new: "Nobody has picked this up yet.",
  in_review: "Someone is looking into it.",
  contacted: "We have replied to the sender.",
  closed: "Nothing more to do.",
};

export const STATUS_COLORS: Record<EnquiryStatus, "error" | "warning" | "info" | "default"> = {
  new: "error",
  in_review: "warning",
  contacted: "info",
  closed: "default",
};

/**
 * Where each inbox's email alerts go. These mirror INBOX_*_EMAIL in backend/.env
 * (decided 2026-11-23); update both together.
 */
export const INBOXES: Record<EnquiryInbox, { label: string; email: string }> = {
  partnerships: { label: "Partnerships", email: "partnerships@sq1ecoafrica.org" },
  volunteers: { label: "Volunteers", email: "career@sq1ecoafrica.org" },
  info: { label: "General", email: "info@sq1ecoafrica.org" },
};

export const KIND_LABELS: Record<EnquiryKind, string> = {
  partnership: "Partnership enquiry",
  volunteer: "Volunteer application",
  contact: "Message",
};

const JOURNEY_BY_KIND: Record<EnquiryKind, JourneyConfig> = {
  partnership: journeys.partnership,
  volunteer: journeys.volunteer,
  contact: journeys.contact,
};

/**
 * The label a person saw on the website for a stored answer, e.g. "few-hours-week"
 * → "A few hours a week". Falls back to the stored value for answers that predate
 * a change of wording.
 */
export function optionLabel(kind: EnquiryKind, field: string, value: string): string {
  for (const step of JOURNEY_BY_KIND[kind].steps) {
    const match = step.fields.find((f) => f.name === field)?.options?.find((o) => o.value === value);
    if (match) return match.label;
  }
  return value;
}

/** "23 Nov 2026, 14:05" in the viewer's time zone. */
export function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "5 min ago", "3 h ago", "2 days ago", then the date. */
export function timeAgo(value: string): string {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
