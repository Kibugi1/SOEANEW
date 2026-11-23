/**
 * Journey definitions. Field lists follow docs/consolidated-guide.pdf:
 * - Partnership (§09): name; organization; email; phone (optional);
 *   partnership interest/category; relevant experience/resources; message;
 *   consent. The API routes every message to its inbox (partnerships,
 *   volunteers or info).
 * - Contact (§11): simple contact form with a clear privacy notice.
 * - Subscribe (§11): updates on community programs, research, partnerships
 *   and learning.
 * - Volunteer: not specified in the guide; fields mirror the volunteer
 *   profile model (function, skills, availability) and need sign-off.
 */

import { teamFunctions } from "@/data/people";
import { firstName, type JourneyConfig, type JourneyOption } from "@/components/journey/types";

const orgName = (answers: Record<string, unknown>) =>
  typeof answers.organization === "string" && answers.organization.trim()
    ? answers.organization.trim()
    : "your organization";

const CONSENT =
  "I agree that Square One Eco Africa may store these details and use them to respond to this enquiry.";

export const partnershipInterests: JourneyOption[] = [
  {
    value: "training",
    label: "Training & Technical Expertise",
    description: "Curriculum development, TVET certification, circular-economy skills, facilitation and mentorship.",
  },
  {
    value: "legal",
    label: "Legal Awareness & Community Rights",
    description: "Paralegal training, legal literacy, environmental rights and access to justice.",
  },
  {
    value: "health-safety",
    label: "Health, Safety & Wellbeing",
    description: "Occupational health and safety, safety marshal training, first aid and protective equipment.",
  },
  {
    value: "finance-enterprise",
    label: "Finance & Enterprise Development",
    description: "Financial literacy, savings, access to suitable finance, entrepreneurship and investment readiness.",
  },
  {
    value: "markets",
    label: "Markets & Livelihoods",
    description: "Product development, employment pathways, buyer relationships and enterprise partnerships.",
  },
  {
    value: "research",
    label: "Research, Innovation & Evidence",
    description: "Program assessments, digital tools, monitoring, community research and learning.",
  },
  {
    value: "resource-mobilization",
    label: "Resource Mobilization",
    description: "Financial, technical, equipment and in-kind support for program development and implementation.",
  },
];

export const partnershipJourney: JourneyConfig = {
  id: "partnership",
  kind: "partnership",
  name: "Partnership journey",
  steps: [
    {
      id: "organization",
      stage: "Organization",
      eyebrow: "Welcome",
      title: "Thank you for starting a partnership journey with us.",
      body: "Let's begin with who you are. What is the name of your organization?",
      fields: [
        {
          name: "organization",
          type: "text",
          label: "Organization name",
          placeholder: "e.g. Nairobi Technical Training Institute",
          helper: "Partnering as an individual? Just write your own name.",
          autoComplete: "organization",
          maxLength: 160,
        },
      ],
    },
    {
      id: "name",
      stage: "Your name",
      title: (answers) => `Wonderful. Who will we be speaking with at ${orgName(answers)}?`,
      fields: [{ name: "name", type: "text", label: "Your full name", autoComplete: "name", maxLength: 120 }],
    },
    {
      id: "contact",
      stage: "Contact details",
      title: (answers) => `Nice to meet you, ${firstName(answers)}. How can we reach you?`,
      body: "Our partnerships team will reply by email.",
      fields: [
        { name: "email", type: "email", label: "Email address", autoComplete: "email", maxLength: 160 },
        { name: "phone", type: "tel", label: "Phone or WhatsApp", optional: true, autoComplete: "tel", maxLength: 20 },
      ],
    },
    {
      id: "interests",
      stage: "Areas of interest",
      title: (answers) => `Where could ${orgName(answers)} contribute?`,
      body: "Choose every area that fits. This helps us connect you with the right part of our work.",
      fields: [{ name: "interests", type: "multichoice", label: "Partnership areas", options: partnershipInterests }],
    },
    {
      id: "experience",
      stage: "Experience & resources",
      title: "What expertise or resources would you bring?",
      body: "A few sentences is plenty: relevant experience, facilities, networks, funding or in-kind support.",
      fields: [{ name: "experience", type: "textarea", label: "Experience and resources", maxLength: 2000 }],
    },
    {
      id: "message",
      stage: "Anything else",
      title: "Is there anything else you'd like us to know?",
      body: "Timelines, ideas you'd like to test together, or questions for our team.",
      fields: [{ name: "message", type: "textarea", label: "Message", optional: true, minLength: 10, maxLength: 2000 }],
    },
  ],
  review: {
    title: (answers) => `Almost done, ${firstName(answers)}. Does this look right?`,
    body: "Check your answers before sending them to our partnerships team.",
    consentLabel: CONSENT,
    submitLabel: "Send partnership inquiry",
  },
  success: {
    title: (answers) => `Thank you, ${firstName(answers)}. Your partnership journey has begun.`,
    body: (answers) =>
      `We've received ${orgName(answers) === "your organization" ? "your" : `${orgName(answers)}'s`} inquiry and shared it with our partnerships team.`,
    nextSteps: [
      "Our partnerships team reviews your inquiry and the areas you selected.",
      "We reply by email to arrange an introductory conversation.",
      "Together we explore where your expertise fits our current priorities, starting with CECI Phase 1.",
    ],
    links: [
      { label: "Explore CECI", href: "/programs/ceci" },
      { label: "Back to home", href: "/" },
    ],
  },
};

export const volunteerJourney: JourneyConfig = {
  id: "volunteer",
  kind: "volunteer",
  name: "Volunteer journey",
  steps: [
    {
      id: "name",
      stage: "Your name",
      eyebrow: "This could be you",
      title: "We'd love to have you on the team.",
      body: "SOEA is volunteer-led. Let's start with your name.",
      fields: [{ name: "name", type: "text", label: "Your full name", autoComplete: "name", maxLength: 120 }],
    },
    {
      id: "contact",
      stage: "Contact details",
      title: (answers) => `Hi ${firstName(answers)}! How can we reach you?`,
      fields: [
        { name: "email", type: "email", label: "Email address", autoComplete: "email", maxLength: 160 },
        { name: "phone", type: "tel", label: "Phone or WhatsApp", optional: true, autoComplete: "tel", maxLength: 20 },
      ],
    },
    {
      id: "area",
      stage: "Where you'd fit",
      title: "Which part of our work excites you most?",
      body: "Our team works across functions, so this is a starting point, not a box.",
      fields: [
        {
          name: "area",
          type: "choice",
          label: "Area of interest",
          options: [
            ...teamFunctions.map((group) => ({ value: group.id, label: group.name })),
            { value: "communications", label: "Storytelling & Communications" },
            { value: "not-sure", label: "Not sure yet", description: "Tell us about yourself and we'll suggest a fit." },
          ],
        },
      ],
    },
    {
      id: "skills",
      stage: "Skills & experience",
      title: "What skills or experience would you bring?",
      body: "Studies, work, community involvement — anything that feels relevant.",
      fields: [{ name: "skills", type: "textarea", label: "Skills and experience", maxLength: 2000 }],
    },
    {
      id: "availability",
      stage: "Availability",
      title: "How much time could you give?",
      fields: [
        {
          name: "availability",
          type: "choice",
          label: "Availability",
          options: [
            { value: "few-hours-week", label: "A few hours a week" },
            { value: "one-day-week", label: "About a day a week" },
            { value: "project-based", label: "Project by project" },
            { value: "flexible", label: "Flexible / let's discuss" },
          ],
        },
      ],
    },
    {
      id: "motivation",
      stage: "Why SOEA",
      title: (answers) => `Last question, ${firstName(answers)}: why SOEA?`,
      body: "What draws you to community-led climate work?",
      fields: [{ name: "motivation", type: "textarea", label: "Why you'd like to volunteer", maxLength: 2000 }],
    },
  ],
  review: {
    title: (answers) => `Looking good, ${firstName(answers)}. Ready to send?`,
    consentLabel: CONSENT,
    submitLabel: "Send my volunteer application",
  },
  success: {
    title: (answers) => `Thank you, ${firstName(answers)}! We're glad you reached out.`,
    body: "Your interest in volunteering with Square One Eco Africa has been received.",
    nextSteps: [
      "Our team reviews your application and the area you chose.",
      "If there's a good fit, we contact you by email to arrange a conversation.",
    ],
    links: [
      { label: "Meet the team", href: "/people-stories#team" },
      { label: "Explore our programs", href: "/programs" },
    ],
  },
};

export const contactTopics: JourneyOption[] = [
  { value: "general", label: "General inquiry" },
  { value: "partnerships", label: "Program partnerships" },
  { value: "community", label: "Community engagement" },
  { value: "research", label: "Research & technical collaboration" },
  { value: "media", label: "Media opportunities" },
  { value: "institutional", label: "Institutional support" },
];

export const contactJourney: JourneyConfig = {
  id: "contact",
  kind: "contact",
  name: "Send a message",
  steps: [
    {
      id: "topic",
      stage: "Topic",
      eyebrow: "Every practical solution begins with a conversation",
      title: "What would you like to talk about?",
      fields: [{ name: "topic", type: "choice", label: "Topic", options: contactTopics }],
    },
    {
      id: "name",
      stage: "Your name",
      title: "Great. What's your name?",
      fields: [
        { name: "name", type: "text", label: "Your full name", autoComplete: "name", maxLength: 120 },
        { name: "organization", type: "text", label: "Organization", optional: true, autoComplete: "organization", maxLength: 160 },
      ],
    },
    {
      id: "email",
      stage: "Email",
      title: (answers) => `Thanks, ${firstName(answers)}. Where should we reply?`,
      fields: [{ name: "email", type: "email", label: "Email address", autoComplete: "email", maxLength: 160 }],
    },
    {
      id: "message",
      stage: "Your message",
      title: "What's on your mind?",
      fields: [{ name: "message", type: "textarea", label: "Message", minLength: 10, maxLength: 3000 }],
    },
  ],
  review: {
    title: "Ready to send your message?",
    consentLabel: CONSENT,
    submitLabel: "Send message",
  },
  success: {
    title: (answers) => `Thank you, ${firstName(answers)}. Your message is on its way.`,
    body: "The right person on our team will get back to you by email.",
    nextSteps: ["We route your message to the right inbox.", "We reply by email, usually within a few working days."],
    links: [
      { label: "Follow our stories", href: "/people-stories/stories" },
      { label: "Back to home", href: "/" },
    ],
  },
};

export const subscribeTopics: JourneyOption[] = [
  { value: "programs", label: "Community programs" },
  { value: "research", label: "Research & evidence" },
  { value: "partnerships", label: "Partnerships" },
  { value: "learning", label: "Learning resources" },
  { value: "taarifa-eco", label: "Taarifa Eco", description: "Be first to hear when the prototype is introduced." },
];

export const subscribeJourney: JourneyConfig = {
  id: "subscribe",
  kind: "subscription",
  name: "Stay connected",
  steps: [
    {
      id: "topics",
      stage: "Your interests",
      eyebrow: "Stay connected",
      title: "What would you like to hear about?",
      fields: [{ name: "topics", type: "multichoice", label: "Updates", options: subscribeTopics }],
    },
    {
      id: "details",
      stage: "Your details",
      title: "Where should we send updates?",
      fields: [
        { name: "email", type: "email", label: "Email address", autoComplete: "email", maxLength: 160 },
        { name: "name", type: "text", label: "First name", optional: true, autoComplete: "given-name", maxLength: 80 },
      ],
    },
  ],
  review: {
    title: "One last check",
    consentLabel:
      "I agree to receive email updates from Square One Eco Africa. I can unsubscribe at any time.",
    submitLabel: "Subscribe",
  },
  success: {
    title: (answers) => (firstName(answers) ? `Almost there, ${firstName(answers)}!` : "Almost there!"),
    body: "Thank you for following our journey. We've sent you an email: open it and confirm your subscription.",
    nextSteps: [
      "Confirm your subscription using the link in our email. Check your spam folder if it hasn't arrived.",
      "We'll then email you when there's news from SOEA.",
    ],
    links: [
      { label: "Follow our stories", href: "/people-stories/stories" },
      { label: "Back to home", href: "/" },
    ],
  },
};

export const journeys = {
  partnership: partnershipJourney,
  volunteer: volunteerJourney,
  contact: contactJourney,
  subscribe: subscribeJourney,
} as const;

export type JourneyId = keyof typeof journeys;
