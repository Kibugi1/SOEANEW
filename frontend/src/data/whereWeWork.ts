export interface CommunityLocation {
  id: string;
  name: string;
  description: string;
  image: string;
  programmeSlug?: string;
  activityStatus: "programme_location" | "geographic_focus";
}

export const whereWeWorkContent = {
  hero: {
    eyebrow: "Our geographic presence",
    title: "Rooted in communities. Connected across Kenya.",
    description:
      "SOEA works with communities across diverse environments, connecting local knowledge, practical skills and partnerships to advance environmental sustainability and resilient livelihoods.",
    image: "/assets/images/hero/landingpage.webp",
  },

  coordinationHub: {
    name: "Nairobi County",
    label: "Coordination Hub & Urban Programmes",
    description:
      "Nairobi is SOEA's coordination hub and the starting point for community-based urban programming. Our work engages with environmental challenges, informal-sector livelihoods and opportunities for practical resource recovery.",
    image: "/assets/images/community/ceciplanning.webp",
  },

  communityLocations: [
    {
      id: "dandora",
      name: "Dandora",
      description:
        "Community grounding, waste-picker engagement, resource recovery, skills development and sustainable livelihood opportunities.",
      image: "/assets/images/community/datassessmentdandora.JPEG",
      programmeSlug: "ceci",
      activityStatus: "programme_location",
    },
    {
      id: "mathare",
      name: "Mathare",
      description:
        "Community engagement, environmental assessments and collaborative learning, including work in Mabatini and Mlango Kubwa.",
      image: "/assets/images/community/mathareofficialssmiles.JPEG",
      programmeSlug: "ceci",
      activityStatus: "programme_location",
    },
  ] satisfies CommunityLocation[],

  geographicFocus: [
    "Tana River",
    "Laikipia",
    "Isiolo",
    "Kajiado",
    "Mombasa",
    "Kwale",
    "Kilifi",
  ],

  geographicFocusDescription:
    "These counties represent geographic areas of focus across rural, arid and semi-arid, and coastal environments. Engagement and programme activities develop in response to community priorities, local context and partnerships.",

  approach: {
    eyebrow: "A growing geographic footprint",
    title: "Local priorities shape where we work.",
    description:
      "Our geographic engagement is guided by community knowledge, environmental needs, opportunities for collaboration and the partnerships required to develop practical solutions. We aim to build relationships that support locally relevant and adaptable approaches.",
  },
};
