/**
 * Innovation page content (docs/consolidated-guide.pdf, §08).
 *
 * Guide rules: show TAARiFA Eco only as a short "Coming Soon" preview and
 * keep it clearly distinct from a released application. Do not publish
 * technical architecture, detailed financial pathways, partner
 * negotiations, unpublished interfaces or internal concept notes.
 *
 * Images marked `placeholder: true` are stand-ins from the existing image
 * library until original illustrations are supplied.
 */

export interface InnovationImage {
  src: string;
  alt: string;
  placeholder: boolean;
}

export const innovationIntro = {
  eyebrow: "08 / Innovation",
  title: "Connecting community skills to practical innovation",
  intro:
    "Through Eco-Tech Innovation Hubs, SOEA explores technologies, digital tools and enterprise models that help communities apply knowledge, access opportunities and strengthen climate resilience.",
};

export const taarifa = {
  name: "TAARiFA Eco",
  status: "Coming soon",
  statusNote: "Concept and prototype in development. Not yet released.",
  tagline:
    "Connecting climate intelligence, community decisions and resilience opportunities.",
  description: [
    "TAARiFA Eco is a community-centered, AI-enabled climate resilience concept currently being developed by SOEA. It seeks to connect three elements: reliable climate and environmental information; practical, locally relevant livelihood and ecosystem-action choices; and pathways to markets, suitable finance and follow-through.",
    "It will help people interpret changing conditions, explore their options and connect with opportunities and partners who can support action.",
  ],
  comingSoon:
    "Watch this space as we develop the idea and prepare to introduce our prototype.",
  image: {
    src: "/assets/images/community/taarifaecoapp.webp",
    alt: "Illustration of the TAARiFA Eco concept",
    placeholder: true,
  } satisfies InnovationImage,
};

export interface TaarifaLayer {
  number: string;
  title: string;
  description: string;
}

/** The three connected layers, in order from information to action. */
export const taarifaLayers: TaarifaLayer[] = [
  {
    number: "01",
    title: "Climate & ecosystem intelligence",
    description:
      "Relevant forecasts, environmental information and community knowledge.",
  },
  {
    number: "02",
    title: "Livelihood & ecosystem choices",
    description:
      "Practical guidance and opportunities adapted to each community and sector.",
  },
  {
    number: "03",
    title: "Finance, market & implementation connections",
    description:
      "Helping people identify relevant partners, resources and ways to follow through.",
  },
];

export interface AdaptableCommunity {
  id: string;
  name: string;
  image: InnovationImage;
}

export const adaptabilityCopy = {
  title: "One approach, adapted to each community",
  body: "The same core approach can be adapted to waste pickers and informal-sector workers, smallholder farmers, pastoralist communities, coastal and blue-economy actors, and other communities through context-specific information and support.",
};

/** Shown only to communicate adaptability (guide §08). */
export const adaptableCommunities: AdaptableCommunity[] = [
  {
    id: "waste-pickers",
    name: "Waste pickers & informal-sector workers",
    image: {
      src: "/assets/images/community/datassessmentdandora.JPEG",
      alt: "Community members in Dandora",
      placeholder: true,
    },
  },
  {
    id: "farmers",
    name: "Smallholder farmers",
    image: {
      src: "/assets/images/community/tractor.webp",
      alt: "Farming landscape",
      placeholder: true,
    },
  },
  {
    id: "pastoralists",
    name: "Pastoralist communities",
    image: {
      src: "/assets/images/community/connectedchallenges.webp",
      alt: "Rural landscape",
      placeholder: true,
    },
  },
  {
    id: "coastal",
    name: "Coastal & blue-economy actors",
    image: {
      src: "/assets/images/community/blueeconomy.webp",
      alt: "Coastal community",
      placeholder: true,
    },
  },
];

export const pathwayIntro = {
  eyebrow: "Building the pathway",
  title: "From community skills to sustainable infrastructure",
  objective:
    "Our long-term objective is to build an enabling ecosystem where community skills, innovation, market opportunities and investment translate into sustainable livelihoods and environmental resilience. This includes developing financially sustainable, locally relevant climate tech innovations and digital applications that address community needs, strengthen economic opportunities and support lasting transformational impact.",
};

export const pathwaySteps = [
  "Train Community Champions",
  "Strengthen Practical Skills",
  "Connect to Markets and Opportunities",
  "Demonstrate Innovative Solutions",
  "Mobilize Investment",
  "Develop Sustainable Infrastructure",
];

export const innovationLinks = {
  followUpdates: {
    label: "Follow TAARiFA Eco updates",
    href: "/stay-connected?topic=taarifa-eco",
  },
  climateInnovation: {
    label: "Explore climate innovation",
    href: "/our-focus/climate-technology",
  },
  ceci: { label: "Explore CECI", href: "/programs/ceci" },
  investment: {
    label: "Discuss an investment partnership",
    href: "/partner-with-us?interest=resource-mobilization",
  },
};
