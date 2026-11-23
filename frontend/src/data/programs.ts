export type ProgrammeStatus =
  | "in_development"
  | "active"
  | "completed"
  | "planned"
  | "archived";

export type ProgrammeVisibility = "draft" | "published";

export interface Programme {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  summary: string;
  description: string;
  coverImage: string;
  status: ProgrammeStatus;
  visibility: ProgrammeVisibility;
  startDate: string;
  endDate: string | null;
  location: string[];
  thematicAreas: string[];
  currentPhase: string;
  featured: boolean;
  objectives: string[];
}

export const programmes: Programme[] = [
  {
    id: "ceci-001",
    slug: "ceci",
    title: "Community Environmental Champions Initiative",
    shortName: "CECI",
    summary:
      "SOEA’s flagship community-led training and development program.",
    // Feedback 19 Nov 2026, §8.2 (opening) and §1 (program → projects).
    description:
      "SOEA’s flagship community-led training and development program, connecting practical skills, rights, environmental action and livelihood opportunities across our six cross-cutting thematic areas. Its first flagship project, WP-LIFT (Waste Pickers’ Livelihood Improvement for Transformation), is underway with waste pickers in Dandora and Mathare; JEET Champions is a developing project in renewable energy and electric mobility.",
    coverImage: "/assets/images/community/ceciplanning.webp",
    status: "in_development",
    visibility: "published",
    startDate: "2026-10-01",
    endDate: null,
    location: ["Dandora", "Mathare", "Nairobi County, Kenya"],
    thematicAreas: [
      "Circular Economy & Waste Management",
      "Gender-Responsive Climate Resilience",
    ],
    currentPhase: "WP-LIFT Phase 1: Curriculum co-design & partnerships (Oct 2026 – Mar 2027)",
    featured: true,
    objectives: [
      "Develop practical circular economy skills.",
      "Strengthen community leadership and environmental stewardship.",
      "Build awareness of occupational health, safety and legal rights.",
      "Connect participants to enterprise and livelihood opportunities.",
    ],
  },
];

export const getPublishedProgrammes = () =>
  programmes.filter((programme) => programme.visibility === "published");

export const getProgrammeBySlug = (slug: string) =>
  getPublishedProgrammes().find((programme) => programme.slug === slug);
