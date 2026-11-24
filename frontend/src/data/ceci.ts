/**
 * CECI program page content.
 *
 * Source: SOEA website feedback & proposed refinements (WP-LIFT revision, 19 Nov 2026),
 * §2.3, §5.2 and §8; JEET content from Chika Atueyi's brief (20 Nov 2026).
 * Structure: CECI program → projects (WP-LIFT, JEET Champions) → WP-LIFT journey,
 * pathways and core learning → project leads.
 *
 * `photo` marks a slot where the team still has to choose a picture from the shared
 * folders; the page shows a labelled placeholder until it is replaced.
 */

export const ceciProgramme = {
  name: "Community Environmental Champions Initiative",
  shortName: "CECI",
  label: "Flagship Program",
  tagline: "Building skills. Strengthening communities. Advancing climate action.",
  /** §8.2 */
  introduction:
    "The Community Environmental Champions Initiative (CECI) is SOEA’s flagship community-led training and development program, connecting practical skills, rights, environmental action and livelihood opportunities across our six cross-cutting thematic areas. Each project adapts a shared approach—community grounding, assessment, co-design, capability development, practical application, market connections and continued learning—to the needs of a particular community or sector. Through CECI, we aim to equip community champions to strengthen their livelihoods, advocate for their interests and sustain practical climate solutions.",
};

export interface CeciProject {
  id: string;
  shortName: string;
  name: string;
  status: string;
  statusTone: "underway" | "developing";
  summary: string;
  href: string;
}

/** Project cards (§8.1). */
export const ceciProjects: CeciProject[] = [
  {
    id: "wp-lift",
    shortName: "WP-LIFT",
    name: "Waste Pickers’ Livelihood Improvement for Transformation",
    status: "First flagship project · Underway",
    statusTone: "underway",
    summary:
      "Co-developing a practical training and livelihood pathway with waste pickers in Dandora and Mathare, Nairobi County.",
    href: "#wp-lift",
  },
  {
    id: "jeet-champions",
    shortName: "JEET Champions",
    name: "Just Energy and Equitable Transition Champions",
    status: "Developing project · Concept in development",
    statusTone: "developing",
    summary:
      "Widening participation in renewable energy and electric mobility, starting with women in boda boda and passenger transport.",
    href: "#jeet-champions",
  },
];

/** §8.3 */
export const wpLift = {
  shortName: "WP-LIFT",
  name: "Waste Pickers’ Livelihood Improvement for Transformation",
  introduction:
    "WP-LIFT — Waste Pickers’ Livelihood Improvement for Transformation — is the first flagship project under CECI, already underway through community engagement and evidence gathering in Dandora and Mathare, Nairobi County. Building on community listening, baseline assessments and the inaugural Waste Pickers Super Day, WP-LIFT co-develops a practical training and livelihood pathway with waste pickers, local stakeholders and technical partners. Its evolving design brings together five material-based specializations, occupational health and safety, legal rights advocacy, financial literacy, entrepreneurship, social skills, leadership and market opportunities. The long-term ambition is stronger community agency, improved livelihoods, safer working conditions and solutions waste pickers can continue to lead and grow.",
  location: "Dandora and Mathare, Nairobi County",
  plannedCohort: "30",
  currentFocus: "Curriculum co-design & partnerships · October 2026 – March 2027",
};

/** Featured story (§8.1 "From the Ground Up"). */
export const groundUpStory = {
  eyebrow: "Featured WP-LIFT story",
  title: "From the Ground Up: The CECI Journey",
  summary:
    "How WP-LIFT began: listening to waste pickers in Dandora and Mathare, gathering baseline evidence, presenting findings to Nairobi City County, and coming together for the first Waste Pickers Super Day.",
  href: "/people-stories/stories",
  photo: {
    src: "/assets/images/programs/ceci/cecicollage.webp",
    alt: "Collage of the CECI journey: waste pickers sorting waste, listening and registration sessions, the segregation challenge and the Waste Pickers Super Day group photo",
  },
};

export type JourneyState = "completed" | "underway" | "upcoming" | "planned";

export interface JourneyStep {
  id: string;
  label: string;
  period: string;
  state: JourneyState;
  title: string;
  description: string;
  photo?: { src: string; alt: string };
}

/** WP-LIFT journey and phases (§8.4 and the project-stage table). */
export const wpLiftJourney: JourneyStep[] = [
  {
    id: "phase-0-grounding",
    label: "Phase 0",
    period: "2026 · Completed",
    state: "completed",
    title: "Planning, community grounding & evidence",
    description:
      "Engagement and baseline assessment in Dandora and Mathare, survey and community sampling, analysis of responses, and presentation and discussion of the findings with stakeholders including Nairobi City County Government. Design priorities identified.",
    photo: {
      src: "/assets/images/programs/ceci/cecicollage.webp",
      alt: "Field and listening photos from the Dandora and Mathare baseline assessment",
    },
  },
  {
    id: "phase-0-super-day",
    label: "Phase 0 milestone",
    period: "10 October 2026 · Completed",
    state: "completed",
    title: "Waste Pickers Super Day",
    description:
      "The inaugural Waste Pickers Super Day at Dandora Community Park brought together more than 80 waste pickers for games, group activities, a segregation challenge and community dialogue. Planned as an annual event every 10 October, subject to planning.",
    photo: {
      src: "/assets/images/programs/ceci/cecibanner.jpg",
      alt: "Waste pickers and SOEA facilitators celebrating in front of the Waste Pickers Super Day 2026 banner at Dandora",
    },
  },
  {
    id: "whats-next",
    label: "What’s next",
    period: "26 November 2026",
    state: "upcoming",
    title: "Public introduction: CECI “What’s Next?” LinkedIn Live",
    description:
      "Introducing the program’s journey and the proposed WP-LIFT pathway, and inviting ideas and partners.",
  },
  {
    id: "phase-1",
    label: "Phase 1",
    period: "October 2026 – March 2027 · Planned window",
    state: "underway",
    title: "Curriculum co-design & partnerships",
    description:
      "Convene a technical working group; validate needs and specializations with waste pickers, trainers and market partners; create the core and specialized curriculum, the assessment and certification approach, cohort readiness and delivery partnerships.",
  },
  {
    id: "phase-2",
    label: "Phase 2",
    period: "Planned · 3–4 months",
    state: "planned",
    title: "Cohort training",
    description:
      "Recruit and train the first proposed 30 champions, delivering core learning and the five specialized pathways with practical demonstration.",
  },
  {
    id: "phase-3",
    label: "Phase 3",
    period: "Planned",
    state: "planned",
    title: "Practical application and market linkages",
    description:
      "Support practice, demonstration, exposure to buyers, circular enterprises, financial services, mentorship and income-generating opportunities.",
  },
  {
    id: "phase-4",
    label: "Phase 4",
    period: "Planned",
    state: "planned",
    title: "Follow-through, learning and expansion",
    description:
      "Measure participant progress and livelihoods, document outcomes and lessons, and support community adoption, replication and scaling where evidence, community priorities and resources support them.",
  },
];

export interface Pathway {
  number: string;
  title: string;
  description: string;
  photo: { src: string; alt: string };
}

const PATHWAY_IMG = "/assets/images/programs/ceci";

/** Five specialized pathways (§8.5). */
export const ceciPathways: Pathway[] = [
  {
    number: "01",
    title: "Organic Waste & Composting",
    description:
      "Explore safe organic waste separation, composting and value creation through soil-improving products and related circular enterprises.",
    photo: { src: `${PATHWAY_IMG}/organicwastepathway01.jpg`, alt: "Waste pickers in gumboots separating mixed waste by hand" },
  },
  {
    number: "02",
    title: "Plastic Recycling & Upcycling",
    description:
      "Build skills in sorting, grading, safe recovery, processing and product innovation, alongside practical market and buyer connections.",
    photo: { src: "/assets/images/championsjourney/connecttoopportunity.jpg", alt: "A sack of recovered plastic containers collected for recycling" },
  },
  {
    number: "03",
    title: "Glass Recovery & Cutting",
    description:
      "Develop safe glass handling, cutting and reuse skills, considering protective equipment, product quality and appropriate markets.",
    photo: { src: `${PATHWAY_IMG}/glassprocessing.png`, alt: "Recovered glass bottles and broken glass gathered for processing" },
  },
  {
    number: "04",
    title: "E-Waste Management",
    description:
      "Strengthen awareness of safe collection, sorting, handling and referral to appropriate licensed recyclers, protecting people and the environment while exploring viable livelihood opportunities.",
    photo: { src: `${PATHWAY_IMG}/electronicwastesorting.png`, alt: "Discarded circuit boards and electronic casings piled for sorting" },
  },
  {
    number: "05",
    title: "Textile Recovery & Upcycling",
    description:
      "Work with recovered fabrics and garments to build practical repair, redesign, reuse and product-development skills connected to market demand.",
    photo: { src: `${PATHWAY_IMG}/textilerecovery.png`, alt: "A large heap of discarded clothing and fabrics awaiting recovery" },
  },
];

/** Cross-cutting core training alongside the five specializations (§8.5). */
export const ceciLearningAreas = [
  "Community leadership and environmental stewardship",
  "Life skills, communication and digital literacy",
  "Financial literacy, savings and enterprise development",
  "Legal rights, paralegal awareness and access to justice",
  "Occupational health, safety and risk management",
  "Gender equality, inclusion and safeguarding",
  "Climate action and environmental resilience",
  "Market access, mentorship and livelihood development",
];

export interface ProjectLead {
  projectId: string;
  name: string;
  title: string;
  photo: { src: string; alt: string };
  profileHref: string;
  ctaLabel: string;
  email: string;
}

/** §8.6 */
export const guidedByPeople =
  "WP-LIFT is shaped by the priorities and lived experience of waste pickers in Dandora and Mathare. Guided by community evidence and strengthened through collaboration with technical institutions, enterprises, partners and local stakeholders, the project is building a pathway for safer work, useful skills, stronger market participation and lasting livelihood opportunities.";

export const projectLeads: ProjectLead[] = [
  {
    projectId: "wp-lift",
    name: "Stephanie Ndiritu",
    title: "Project Lead — WP-LIFT (under CECI)",
    photo: { src: "/assets/images/team/volunteers/stephanie.jpg", alt: "Portrait of Stephanie Ndiritu" },
    profileHref: "/people-stories/stephanie-ndiritu",
    ctaLabel: "Connect with Stephanie to co-design WP-LIFT’s curriculum and next steps",
    // The feedback document gives s.ndiritu@sq1africa.org; every other SOEA address uses
    // sq1ecoafrica.org, so that is used here. Confirm before publishing.
    email: "s.ndiritu@sq1ecoafrica.org",
  },
  {
    projectId: "jeet-champions",
    name: "Chika Atueyi",
    title: "Project Lead — JEET Champions (under CECI)",
    photo: { src: "/assets/images/team/volunteers/chika.jpeg", alt: "Portrait of Chika Atueyi" },
    profileHref: "/people-stories/chika-atueyi",
    ctaLabel: "Help shape the first JEET Champions cohort",
    email: "c.atueyi@sq1ecoafrica.org",
  },
];

/** §5.2 and Chika Atueyi's brief (20 Nov 2026). */
export const jeetChampions = {
  shortName: "JEET Champions",
  name: "Just Energy and Equitable Transition Champions",
  status: "Concept in development",
  pathway: "Green Mobility Champions pathway",
  introduction:
    "JEET Champions is an emerging project under the Community Environmental Champions Initiative, using SOEA’s community-led training methodology to widen participation in renewable energy and electric mobility. Its initial electric mobility pathway will prioritize women, while including youth and persons with disabilities, and explore opportunities connected to ride-hailing, passenger vehicles and boda boda transport. Participants will build practical knowledge, confidence, advocacy skills and understanding of the livelihood and enterprise opportunities linked to cleaner mobility. The project will also promote informed community engagement with renewable energy solutions and the economic possibilities they can create.",
  places: "Pilot in Nairobi, with potential adaptation to Kajiado and later scale-up in Isiolo",
  conceptNote: "An approved summary of the concept note will be linked here once available.",
};
