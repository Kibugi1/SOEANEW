export interface CommunityLocation {
  id: string;
  name: string;
  description: string;
  /** A photo, or a short muted looping video clip when `video` is set. */
  media: { src: string; alt: string; video?: boolean };
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
    label: "Coordination Hub & Urban Programs",
    description:
      "Nairobi is SOEA's coordination hub and the starting point for community-based urban programming. In Dandora and Mathare, WP-LIFT, the first flagship project under the Community Environmental Champions Initiative (CECI), is already underway, working with waste pickers on safer work, practical skills, resource recovery and livelihoods.",
    image: "/assets/images/where-we-work/nairobi.jpg",
    imageAlt: "Aerial view of the Nairobi city skyline",
  },

  communityLocations: [
    {
      id: "dandora",
      name: "Dandora",
      description:
        "Community grounding, waste-picker engagement, resource recovery, skills development and sustainable livelihood opportunities through WP-LIFT.",
      media: {
        src: "/assets/images/where-we-work/dandoraplanning.JPEG",
        alt: "SOEA team members filling in a registration sheet as Dandora community members look on during a planning session",
      },
      programmeSlug: "ceci",
      activityStatus: "programme_location",
    },
    {
      id: "mathare",
      name: "Mathare",
      description:
        "Community engagement, environmental assessments and collaborative learning, including work in Mabatini and Mlango Kubwa, through WP-LIFT.",
      media: {
        src: "/assets/images/where-we-work/mathareplanning.MOV",
        alt: "Video clip of a community planning session in Mathare",
        video: true,
      },
      programmeSlug: "ceci",
      activityStatus: "programme_location",
    },
  ] satisfies CommunityLocation[],

  geographicFocus: [
    // Nine counties of focus with Nairobi (feedback 19 Nov 2026, §10).
    "Tana River",
    "Laikipia",
    "Isiolo",
    "Mombasa",
    "Kajiado",
    "Kwale",
    "Kilifi",
    "Samburu",
  ],

  geographicFocusDescription:
    "These counties represent geographic areas of focus across rural, arid and semi-arid, and coastal environments. Engagement and program activities develop in response to community priorities, local context and partnerships.",

  approach: {
    eyebrow: "A growing geographic footprint",
    title: "Local priorities shape where we work.",
    description:
      "Our geographic engagement is guided by community knowledge, environmental needs, opportunities for collaboration and the partnerships required to develop practical solutions. We aim to build relationships that support locally relevant and adaptable approaches.",
  },
};
