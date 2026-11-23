/**
 * Innovation page content (docs/consolidated-guide.pdf, §08).
 *
 * Guide rules: show Taarifa Eco only as a short "Coming Soon" preview and
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
    // Feedback 19 Nov 2026, §6.
    "SOEA’s EcoTech Innovation Hubs connect community knowledge with practical climate technologies, digital tools and local innovation. Our developing Taarifa Eco application brings together layers of climate and early warning information, community savings and digital financial inclusion, adaptation financing, participatory land-use information and zoning, and practical decisions for farming, grazing, rangeland restoration and ecosystem resilience. Designed with rural and climate-vulnerable communities, the platform is intended to turn timely information into concrete local action and stronger livelihoods. As the prototype develops, Taarifa Eco will inform the growth of community-centered EcoTech Innovation Hubs that support learning, innovation and practical solutions across SOEA’s areas of focus.",
};

export const taarifa = {
  name: "Taarifa Eco",
  status: "Prototype in development · Coming soon",
  statusNote: "Prototype in development. Not yet a public application.",
  tagline:
    "Connecting climate intelligence, community decisions and resilience opportunities.",
  description: [
    "Taarifa Eco is a community-centered, AI-enabled climate resilience concept currently being developed by SOEA. It seeks to connect three elements: reliable climate and environmental information; practical, locally relevant livelihood and ecosystem-action choices; and pathways to markets, suitable finance and follow-through.",
    "It will help people interpret changing conditions, explore their options and connect with opportunities and partners who can support action.",
    "CECI develops people’s skills and community champions; Taarifa Eco develops enabling technology and decision support. Both connect through co-design, evidence and the ambition for community-owned solutions.",
  ],
  comingSoon:
    "Watch this space as we develop the idea and prepare to introduce our prototype.",
  image: {
    src: "/assets/images/community/taarifaecoapp.webp",
    alt: "Illustration of the Taarifa Eco concept",
    placeholder: true,
  } satisfies InnovationImage,
};

export interface TaarifaLayer {
  number: string;
  title: string;
  description: string;
}

/** Seven layers, from community knowledge to hub support (feedback 19 Nov 2026, §6). */
export const taarifaLayers: TaarifaLayer[] = [
  {
    number: "01",
    title: "Local knowledge & community input",
    description:
      "What communities already know about their land, livelihoods and risks, shared on their terms.",
  },
  {
    number: "02",
    title: "Climate information & early warnings",
    description:
      "Timely, localized forecasts and early warnings that people can act on.",
  },
  {
    number: "03",
    title: "Digital savings & financial inclusion",
    description:
      "Community savings and digital financial tools that build a buffer against shocks.",
  },
  {
    number: "04",
    title: "Adaptation finance & matched resources",
    description:
      "Connections to adaptation finance and matched-resource opportunities.",
  },
  {
    number: "05",
    title: "Land use, zoning, agriculture & rangeland planning",
    description:
      "Participatory land-use information and zoning for farming, grazing and rangeland decisions.",
  },
  {
    number: "06",
    title: "Restoration action & outcome tracking",
    description:
      "Practical restoration work, with progress and outcomes tracked over time.",
  },
  {
    number: "07",
    title: "EcoTech Innovation Hub support",
    description:
      "Community-centered hubs that support learning, innovation and follow-through.",
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
    label: "Follow Taarifa Eco updates",
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
