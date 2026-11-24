import { SOCIAL } from "@/components/ui/SocialLinks";

/** An upcoming live event shown with a countdown on the home and CECI pages. */
export type LiveEvent = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  topics: string[];
  speakers: string[];
  /** ISO times with the Nairobi offset, so the countdown is right in any time zone. */
  startsAt: string;
  endsAt: string;
  whenLabel: string;
  poster: { src: string; alt: string; width: number; height: number };
  /** Where people click "Attend". */
  attendHref: string;
  attendLabel: string;
  alsoLiveOn: string;
};

export const ceciWhatNext: LiveEvent = {
  id: "ceci-what-next",
  eyebrow: "Live discussion · CECI",
  title: "CECI: What Next?",
  summary:
    "The future of SOEA's Community Environmental Champions Initiative starts here. Join the founders, community leaders, county government and partners for a live conversation.",
  topics: ["Waste pickers", "Skills and circular pathways", "Markets", "Policy", "Legal rights", "Partnerships"],
  speakers: [
    "Rozalia Karanja, Founder & Executive Lead, SOEA",
    "Stephanie Ndiritu, Project Lead, WP-LIFT, CECI",
    "Gideon Mumo, Chairperson, Mathare Dream Chasers",
    "Lesley Karwitha, Asst. Director, Environmental Education and Public Participation, Nairobi City County Government",
    "Leon Jaeger, International Circular Economy and Waste Management professional",
    "Catherine Masolia, CEO, Somo Africa",
  ],
  startsAt: "2026-11-26T20:00:00+03:00",
  endsAt: "2026-11-26T21:30:00+03:00",
  whenLabel: "Thursday 26 November 2026 · 8:00–9:30 PM EAT",
  poster: {
    src: "/assets/images/events/ceci-what-next-poster.jpg",
    alt: "CECI: What Next? poster with the six speakers: Rozalia Karanja, Stephanie Ndiritu, Gideon Mumo, Lesley Karwitha, Leon Jaeger and Catherine Masolia. Thursday 26 November 2026, 8:00 to 9:30 PM EAT, live on LinkedIn, Facebook and YouTube.",
    width: 2160,
    height: 1215,
  },
  // TODO: swap for the LinkedIn event's own link when it's shared.
  attendHref: SOCIAL.linkedin,
  attendLabel: "Attend on LinkedIn",
  alsoLiveOn: "Also live on Facebook and YouTube @ Square One Eco Africa",
};
