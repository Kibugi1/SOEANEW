import type { PhotoNeeded } from "@/components/ui/ImagePlaceholder";

export interface CommunityLocation {
  id: string;
  name: string;
  description: string;
  /** Null while the requested photo is chosen (feedback 19 Nov 2026, §10); see `photo`. */
  image: string | null;
  photo?: PhotoNeeded;
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
    image: null as string | null,
    photo: {
      needed: "A licensed Nairobi skyline image: well framed, not cropped, and not a community engagement photo.",
      source: "Licensed stock photo (not in the shared folders); confirm the license before use",
    } satisfies PhotoNeeded,
  },

  communityLocations: [
    {
      id: "dandora",
      name: "Dandora",
      description:
        "Community grounding, waste-picker engagement, resource recovery, skills development and sustainable livelihood opportunities through WP-LIFT.",
      image: null,
      photo: {
        needed: "Dandora community discussion at Light Academy Hall: people taking part and listening.",
        source: "Dandora second community engagement photos",
      },
      programmeSlug: "ceci",
      activityStatus: "programme_location",
    },
    {
      id: "mathare",
      name: "Mathare",
      description:
        "Community engagement, environmental assessments and collaborative learning, including work in Mabatini and Mlango Kubwa, through WP-LIFT.",
      image: null,
      photo: {
        needed: "Mathare listening and analysis sessions: community members discussing findings.",
        source: "Mathare baseline/community meetings folder",
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
