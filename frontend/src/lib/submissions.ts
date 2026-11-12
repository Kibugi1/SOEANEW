/**
 * Submissions from the site's journeys (partnership, volunteer, contact,
 * subscribe).
 *
 * TEMPORARY STORAGE: until the Flask backend has ContactEnquiry/Subscriber
 * models (backend/docs/BACKEND_STATUS.md §13), submissions are kept in the
 * visitor's own browser (localStorage). Nothing leaves the device, so the
 * admin dashboard can only see submissions made in the same browser.
 * Swap `storageAdapter` for an API adapter when the endpoints exist; the
 * rest of the app only talks to the functions exported here.
 */

export type SubmissionKind = "partnership" | "volunteer" | "contact" | "subscription";

export type SubmissionStatus = "new" | "in_review" | "contacted" | "closed";

export type AnswerValue = string | string[] | boolean;
export type Answers = Record<string, AnswerValue>;

/** Inbox a submission routes to (guide §09: partnerships inbox, not individuals). */
export type Inbox = "info" | "partnerships";

export interface Submission {
  id: string;
  /** Short human-readable reference shown to the person, e.g. "SOEA-PA-7K3F". */
  reference: string;
  kind: SubmissionKind;
  inbox: Inbox;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  answers: Answers;
  /** Page the journey was completed on. */
  source: string;
}

export interface NewSubmission {
  kind: SubmissionKind;
  inbox: Inbox;
  answers: Answers;
  source: string;
}

interface StorageAdapter {
  list(): Promise<Submission[]>;
  save(submission: Submission): Promise<void>;
  update(id: string, patch: Partial<Pick<Submission, "status">>): Promise<Submission | null>;
}

const STORAGE_KEY = "soea.submissions.v1";

function readAll(): Submission[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Submission[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage blocked or full: the submission still shows as received for the
    // visitor, but will not appear in the local dashboard.
  }
}

const localStorageAdapter: StorageAdapter = {
  async list() {
    return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async save(submission) {
    writeAll([submission, ...readAll()]);
  },
  async update(id, patch) {
    const items = readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
    writeAll(items);
    return items[index];
  },
};

const storageAdapter: StorageAdapter = localStorageAdapter;

const kindCode: Record<SubmissionKind, string> = {
  partnership: "PA",
  volunteer: "VO",
  contact: "CO",
  subscription: "SU",
};

function makeReference(kind: SubmissionKind) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `SOEA-${kindCode[kind]}-${code}`;
}

export async function createSubmission(input: NewSubmission): Promise<Submission> {
  const now = new Date().toISOString();
  const submission: Submission = {
    id: crypto.randomUUID(),
    reference: makeReference(input.kind),
    status: "new",
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  await storageAdapter.save(submission);
  return submission;
}

export const listSubmissions = () => storageAdapter.list();

export const updateSubmissionStatus = (id: string, status: SubmissionStatus) =>
  storageAdapter.update(id, { status });
