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
      "Developing community champions for practical climate action.",
    description:
      "Our cross-thematic training and development programme is beginning with waste pickers in Dandora and Mathare. The first CECI pathway focuses on circular economy skills, community leadership, safety, legal awareness, finance and livelihoods.",
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
    currentPhase: "Phase 1: Curriculum Development & Partnerships",
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
