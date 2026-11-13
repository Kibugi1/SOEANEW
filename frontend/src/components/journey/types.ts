import type { Answers, Inbox, SubmissionKind } from "@/lib/submissions";

export type { Answers };

/** Text that can use what the person has already told us. */
export type Dynamic = string | ((answers: Answers) => string);

export interface JourneyOption {
  value: string;
  label: string;
  description?: string;
}

export type JourneyFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "choice"
  | "multichoice";

export interface JourneyField {
  name: string;
  type: JourneyFieldType;
  /** Short label used on the field and on the review screen. */
  label: string;
  placeholder?: string;
  helper?: string;
  optional?: boolean;
  options?: JourneyOption[];
  autoComplete?: string;
  maxLength?: number;
}

export interface JourneyStep {
  id: string;
  /** Name shown in the progress tracker, e.g. "Organization". */
  stage: string;
  eyebrow?: Dynamic;
  title: Dynamic;
  body?: Dynamic;
  fields: JourneyField[];
}

export interface JourneyLink {
  label: string;
  href: string;
}

export interface JourneyConfig {
  id: string;
  kind: SubmissionKind;
  /** e.g. "Partnership journey" — used for the progress tracker heading. */
  name: string;
  steps: JourneyStep[];
  inbox: (answers: Answers) => Inbox;
  review: {
    title: Dynamic;
    body?: Dynamic;
    consentLabel: string;
    submitLabel: string;
  };
  success: {
    title: Dynamic;
    body: Dynamic;
    nextSteps: string[];
    links: JourneyLink[];
  };
}

export const resolve = (text: Dynamic | undefined, answers: Answers) =>
  typeof text === "function" ? text(answers) : (text ?? "");

export const firstName = (answers: Answers, field = "name") => {
  const value = answers[field];
  return typeof value === "string" ? value.trim().split(/\s+/)[0] ?? "" : "";
};
