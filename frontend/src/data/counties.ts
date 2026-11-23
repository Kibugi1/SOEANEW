/**
 * SOEA's nine counties of focus (website feedback, 19 Nov 2026, §10).
 *
 * Sources for the descriptions: the feedback document (Nairobi as coordination hub with
 * WP-LIFT underway), Chika Atueyi's JEET Champions brief (20 Nov 2026: Nairobi pilot,
 * potential adaptation to Kajiado, later scale-up in Isiolo), SOEA's ICARR post
 * (partners invited for work in Isiolo and other ASAL counties) and the Blue Economy &
 * Coastal Resilience focus area. Where no project exists yet, the text says so.
 */

export type CountyStatus = "active" | "focus";
export type CountySetting = "urban" | "asal" | "coastal";

export interface FocusCounty {
  /** Matches the slug in src/data/geo/kenya-counties.json. */
  slug: string;
  name: string;
  status: CountyStatus;
  setting: CountySetting;
  headline: string;
  description: string;
  links?: { label: string; href: string }[];
  /** Nudge for the map label, in screen pixels, where neighbours' labels would collide. */
  labelOffset?: [number, number];
}

export const SETTING_LABELS: Record<CountySetting, string> = {
  urban: "Urban",
  asal: "Arid & semi-arid lands (ASAL)",
  coastal: "Coastal",
};

const LATER = "Specific projects and links will be added here as the work progresses.";

export const focusCounties: FocusCounty[] = [
  {
    slug: "nairobi",
    name: "Nairobi",
    status: "active",
    setting: "urban",
    headline: "Coordination hub · WP-LIFT underway",
    description:
      "SOEA’s coordination hub. In Dandora and Mathare, WP-LIFT, the first flagship project under the Community Environmental Champions Initiative (CECI), is already underway with waste pickers. JEET Champions also plans its first pilot here.",
    links: [
      { label: "WP-LIFT", href: "/programs/ceci#wp-lift" },
      { label: "The CECI journey", href: "/programs/ceci#wp-lift-journey" },
    ],
  },
  {
    slug: "kajiado",
    name: "Kajiado",
    status: "focus",
    setting: "asal",
    headline: "County of focus · JEET Champions, potential next step",
    description:
      "After its Nairobi pilot, JEET Champions has the potential to be adapted and expanded into Kajiado, informed by lessons from each stage.",
    links: [{ label: "JEET Champions", href: "/programs/ceci#jeet-champions" }],
  },
  {
    slug: "isiolo",
    labelOffset: [20, 8],
    name: "Isiolo",
    status: "focus",
    setting: "asal",
    headline: "County of focus · ASAL resilience",
    description:
      "JEET Champions envisages a later scale-up in Isiolo. SOEA also welcomes partners as it advances gender-responsive climate resilience work in Isiolo and other ASAL counties.",
    links: [{ label: "JEET Champions", href: "/programs/ceci#jeet-champions" }],
  },
  {
    slug: "samburu",
    labelOffset: [-14, -10],
    name: "Samburu",
    status: "focus",
    setting: "asal",
    headline: "County of focus",
    description: `Part of SOEA’s rural and arid and semi-arid focus, alongside pastoralist and farming communities. ${LATER}`,
  },
  {
    slug: "laikipia",
    name: "Laikipia",
    status: "focus",
    setting: "asal",
    headline: "County of focus",
    description: `Part of SOEA’s rural and arid and semi-arid focus. ${LATER}`,
  },
  {
    slug: "tana-river",
    name: "Tana River",
    status: "focus",
    setting: "asal",
    headline: "County of focus",
    description: `Part of SOEA’s rural and arid and semi-arid focus. ${LATER}`,
  },
  {
    slug: "mombasa",
    labelOffset: [48, 6],
    name: "Mombasa",
    status: "focus",
    setting: "coastal",
    headline: "Coastal county of focus",
    description: `Connected to SOEA’s Blue Economy & Coastal Resilience focus area. ${LATER}`,
    links: [{ label: "Blue Economy & Coastal Resilience", href: "/our-focus/blue-economy" }],
  },
  {
    slug: "kwale",
    labelOffset: [-30, 16],
    name: "Kwale",
    status: "focus",
    setting: "coastal",
    headline: "Coastal county of focus",
    description: `Connected to SOEA’s Blue Economy & Coastal Resilience focus area. ${LATER}`,
    links: [{ label: "Blue Economy & Coastal Resilience", href: "/our-focus/blue-economy" }],
  },
  {
    slug: "kilifi",
    labelOffset: [30, -4],
    name: "Kilifi",
    status: "focus",
    setting: "coastal",
    headline: "Coastal county of focus",
    description: `Connected to SOEA’s Blue Economy & Coastal Resilience focus area. ${LATER}`,
    links: [{ label: "Blue Economy & Coastal Resilience", href: "/our-focus/blue-economy" }],
  },
];
