/**
 * Sends the site's journeys (partnership, volunteer, contact, subscribe) to the
 * SOEA API (backend/docs/API_HANDOFF.md §6).
 *
 * Website messages go to POST /contact-enquiries; the server decides which inbox
 * each one lands in (partnerships, volunteers or info) and emails that inbox an
 * alert. Subscriptions go to POST /newsletter-subscriptions, which sends a
 * confirmation email and returns no reference.
 */

import { ApiError, apiFetch } from "@/lib/admin/api";

export type SubmissionKind = "partnership" | "volunteer" | "contact" | "subscription";

export type AnswerValue = string | string[] | boolean;
export type Answers = Record<string, AnswerValue>;

export interface Submission {
  /** Reference the person can quote, e.g. "SOEA-VO-7K3F9Q". Absent for subscriptions. */
  reference: string | null;
}

export interface NewSubmission {
  kind: SubmissionKind;
  answers: Answers;
  /** Page the journey was completed on. */
  source: string;
}

const text = (value: AnswerValue | undefined): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const list = (value: AnswerValue | undefined): string[] | undefined =>
  Array.isArray(value) && value.length ? value : undefined;

/** Journey answers → the fields the API accepts for that kind (it rejects unknown ones). */
function enquiryPayload({ kind, answers, source }: NewSubmission) {
  const common = {
    kind,
    name: text(answers.name),
    email: text(answers.email),
    phone: text(answers.phone),
    consent: true,
    source_page: source.slice(0, 200),
  };
  switch (kind) {
    case "partnership":
      return {
        ...common,
        organization: text(answers.organization),
        interests: list(answers.interests),
        experience_resources: text(answers.experience),
        message: text(answers.message),
      };
    case "volunteer":
      return {
        ...common,
        area: text(answers.area),
        skills: text(answers.skills),
        availability: text(answers.availability),
        motivation: text(answers.motivation),
      };
    default:
      return {
        ...common,
        topic: text(answers.topic),
        organization: text(answers.organization),
        message: text(answers.message),
      };
  }
}

export async function createSubmission(input: NewSubmission): Promise<Submission> {
  if (input.kind === "subscription") {
    await apiFetch("/newsletter-subscriptions", {
      method: "POST",
      auth: false,
      json: { email: text(input.answers.email), consent: true },
    });
    return { reference: null };
  }

  const payload = await apiFetch<{ data: { reference: string } }>("/contact-enquiries", {
    method: "POST",
    auth: false,
    json: enquiryPayload(input),
  });
  return { reference: payload.data.reference };
}

/** A message for the person when sending fails, in the journey's own voice. */
export function submissionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong while sending. Please try again.";
  if (error.status === 0) return "We couldn't reach our server. Check your connection and try again.";
  if (error.status === 429) return "We've received several messages from you in a short time. Please try again in an hour.";
  if (error.status === 400) {
    const first = Object.values(error.details).flat()[0];
    return typeof first === "string"
      ? `Please check your answers: ${first}`
      : "Please check your answers and try again.";
  }
  return "Something went wrong while sending. Please try again.";
}
