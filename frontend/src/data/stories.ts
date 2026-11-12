/**
 * Stories and evidence (docs/consolidated-guide.pdf, §07).
 *
 * Every story carries the guide's canonical record fields. People are linked
 * by id (`linkedTeamIds` → `src/data/people.ts`), programmes by id
 * (`programmeId` → `src/data/programs.ts`).
 *
 * Publishing rules from the guide: consent and privacy review before
 * publishing identifiable participant stories; no invented testimonials.
 * Leave a field empty rather than guessing; links stay null until the
 * resource is approved and hosted.
 */

export type StoryStatus = "completed" | "current" | "planned";

export interface StoryMedia {
  type: "image" | "video";
  src: string;
  alt: string;
}

export interface StoryAttachment {
  label: string;
  href: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  /** ISO date of the activity, or null when the guide gives none. */
  date: string | null;
  /** Human-readable date shown in the timeline. */
  dateLabel: string;
  status: StoryStatus;
  programmeId: string | null;
  community: string[];
  phase: string;
  linkedTeamIds: string[];
  approvedPartners: string[];
  summary: string;
  gallery: StoryMedia[];
  attachment: StoryAttachment | null;
  nextStep: string | null;
  socialUrl: string | null;
  /** Set only after consent and privacy review. */
  consentReviewed: boolean;
}

export const storiesIntro = {
  eyebrow: "07 / Stories",
  title: "Following the journey from the ground up",
  intro:
    "Every community engagement contributes to our understanding. Every training milestone creates an opportunity for learning. Every outcome helps us understand what is working. We document the journey of our programs through community research, photographs, videos, field reports, participant experiences and follow-up assessments.",
};

export const stories: Story[] = [
  {
    id: "ceci-community-grounding",
    slug: "ceci-community-grounding",
    title: "Community grounding: understanding the starting point",
    date: null,
    dateLabel: "Phase 0 · Completed",
    status: "completed",
    programmeId: "ceci-001",
    community: ["Dandora", "Mathare"],
    phase: "Community Grounding & Mobilisation",
    linkedTeamIds: [],
    approvedPartners: [],
    summary:
      "Our community grounding and baseline assessment in Dandora and Mathare examined waste management practices, working conditions, livelihoods, environmental challenges and community priorities. The findings inform our program design and curriculum development.",
    gallery: [],
    attachment: null,
    nextStep: "Publish the Community Grounding and Baseline Findings Report.",
    socialUrl: null,
    consentReviewed: false,
  },
  {
    id: "ceci-waste-pickers-super-day",
    slug: "ceci-waste-pickers-super-day",
    title: "Connecting the community: Waste Pickers Super Day",
    date: "2026-10-10",
    dateLabel: "10 October 2026",
    status: "completed",
    programmeId: "ceci-001",
    community: ["Dandora"],
    phase: "Community Grounding & Mobilisation",
    linkedTeamIds: [],
    approvedPartners: [],
    summary:
      "The Waste Pickers Super Day brought waste pickers and local partners together at Dandora Community Park for dialogue, shared experiences, activities and the introduction of the CECI program.",
    gallery: [],
    attachment: null,
    nextStep: "Publish event highlights and video.",
    socialUrl: null,
    consentReviewed: false,
  },
  {
    id: "ceci-building-the-curriculum",
    slug: "ceci-building-the-curriculum",
    title: "Building the curriculum",
    date: "2026-10-01",
    dateLabel: "October 2026 – March 2027",
    status: "current",
    programmeId: "ceci-001",
    community: ["Dandora", "Mathare"],
    phase: "Curriculum Development & Partnerships",
    linkedTeamIds: [],
    approvedPartners: [],
    summary:
      "The next stage brings together community knowledge, technical expertise and partnerships to shape the first training curriculum.",
    gallery: [],
    attachment: null,
    nextStep: "Follow curriculum development, or partner with us to shape it.",
    socialUrl: null,
    consentReviewed: false,
  },
];

export const featuredResource = {
  title:
    "SOEA: Community Grounding and Baseline Findings Report: Dandora and Mathare Communities Waste Management Project",
  /** Null until the report is approved and hosted. */
  href: null as string | null,
};

export const championsIntro = {
  title: "Stories of our Champions",
  body: "Follow participating community members from their starting experiences through training, practical skills development, opportunities and longer-term progress.",
  pendingNote:
    "Champion journeys will be published as participants join the program and consent to share their stories.",
};

export const evidenceIntro = {
  eyebrow: "07 / Evidence",
  title: "Our evidence library",
  intro:
    "Through Eco-Storytelling & Advocacy, we make community experiences, program learning and evidence accessible to communities, practitioners, institutions and decision-makers.",
};

export interface EvidenceCategory {
  id: string;
  name: string;
}

export const evidenceCategories: EvidenceCategory[] = [
  { id: "research", name: "Community research and baseline reports" },
  { id: "field", name: "Field engagement summaries" },
  { id: "progress", name: "Program progress updates" },
  { id: "training", name: "Training materials and learning resources" },
  { id: "voices", name: "Community voices and interviews" },
  { id: "media", name: "Videos and photo stories" },
  { id: "outcomes", name: "Outcome assessments and lessons learned" },
];

export interface EvidenceResource {
  id: string;
  title: string;
  categoryId: string;
  programmeId: string | null;
  storyId: string | null;
  /** Null until the resource is approved and hosted. */
  href: string | null;
}

export const evidenceResources: EvidenceResource[] = [
  {
    id: "ceci-baseline-report",
    title: featuredResource.title,
    categoryId: "research",
    programmeId: "ceci-001",
    storyId: "ceci-community-grounding",
    href: featuredResource.href,
  },
];

/** Stories newest first; undated stories sort last. */
export const getStoriesNewestFirst = () =>
  [...stories].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

export const getStoriesByProgrammes = (programmeIds: string[]) =>
  stories.filter(
    (story) => story.programmeId && programmeIds.includes(story.programmeId)
  );

export const getStoriesForPerson = (personId: string, programmeIds: string[]) =>
  stories.filter(
    (story) =>
      story.linkedTeamIds.includes(personId) ||
      (story.programmeId !== null && programmeIds.includes(story.programmeId))
  );
