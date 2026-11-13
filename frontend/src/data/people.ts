/**
 * People & Stories content.
 *
 * Sources:
 * - Volunteer names, roles and biographies: docs/consolidated-guide.pdf, §07A
 *   (exact spellings from the PDF take precedence over the .docx).
 * - Board, founder letter, team functions and opening copy:
 *   docs/people-and-stories-guide.docx.
 *
 * - Volunteer portraits: public/assets/images/team/volunteers (supplied by
 *   the team, Nov 2026).
 *
 * Do not invent qualifications, email addresses, portraits, quotes or
 * completed deliverables. Fields that the guide marks "to complete" stay
 * empty (null or []) until staff supply and approve them; the UI hides or
 * explains empty fields instead of filling them.
 */

export interface PersonPhoto {
  src: string;
  alt: string;
}

/** One dated, verified entry in a volunteer's activity feed. */
export interface PersonActivity {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  summary: string;
  /** Optional link to a story in `src/data/stories.ts`. */
  storyId?: string;
}

export type TeamFunctionId =
  | "finance-administration"
  | "program-support"
  | "programs-partnerships-meal"
  | "ict";

export interface TeamFunction {
  id: TeamFunctionId;
  name: string;
}

export interface Volunteer {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  /** Full role title shown on the profile page. */
  role: string;
  /** Short role shown under the name in the directory grid. */
  shortRole: string;
  teamFunction: TeamFunctionId;
  /** 70 to 100-word approved biography. */
  bio: string;
  relatedWork: string[];
  /** Programme ids from `src/data/programs.ts`. */
  programmeIds: string[];
  photo: PersonPhoto | null;
  education: string[];
  activities: PersonActivity[];
  /** Approved work email; null until supplied and approved. */
  email: string | null;
  /** One-line fun fact supplied by the volunteer; optional. */
  funFact: string | null;
}

export interface BoardMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: PersonPhoto;
}

export const peopleIntro = {
  eyebrow: "07 / People & Stories",
  title: "People. Partnerships. Practical climate solutions.",
  intro:
    "At Square One Eco Africa (SOEA), we believe meaningful climate action begins with people, their knowledge, their priorities and their ability to shape decisions that affect their lives. We bring communities, technical expertise, institutions and partners together to co-design responses to environmental and development challenges, with the aim of building solutions that work in practice and remain useful over time.",
  valueProposition:
    "Co-creating with communities, we deliver practical climate solutions that lead to transformational impact.",
  closing:
    "The people below guide, lead and support this work, with governance that keeps us accountable and a volunteer team that makes day-to-day progress possible.",
};

export const teamIntro = {
  eyebrow: "07A / Meet the people behind our work",
  title: "The people turning our commitments into action",
  intro:
    "SOEA is volunteer-led. Our multidisciplinary team supports the organization's day-to-day coordination, systems development, community engagement, programs, partnerships and technology work. Each person contributes a distinct set of skills, while working across functions to help SOEA move from ideas and community insights to practical action.",
};

/** Directory order follows the guide's grouping by function. */
export const teamFunctions: TeamFunction[] = [
  { id: "programs-partnerships-meal", name: "Programs, Partnerships & MEAL" },
  { id: "program-support", name: "Program Support & Internal Management" },
  { id: "finance-administration", name: "Finance & Administration" },
  { id: "ict", name: "ICT & Software Development" },
];

const CECI_ID = "ceci-001";

const volunteerPhoto = (file: string, name: string): PersonPhoto => ({
  src: `/assets/images/team/volunteers/${file}`,
  alt: `Portrait of ${name}`,
});

export const volunteers: Volunteer[] = [
  {
    id: "stephanie-ndiritu",
    slug: "stephanie-ndiritu",
    name: "Stephanie Ndiritu",
    firstName: "Stephanie",
    role: "Volunteer Program Officer & Project Lead: CECI",
    shortRole: "Program Officer (Volunteer), CECI Lead",
    teamFunction: "programs-partnerships-meal",
    bio: "Stephanie coordinates the Community Environmental Champions Initiative, connecting community evidence and engagement to curriculum development, program planning, practical training opportunities and implementation partnerships. She works with colleagues and community partners to keep the CECI pathway responsive to what waste pickers in Dandora and Mathare have identified and to document progress from baseline assessment through subsequent milestones.",
    relatedWork: [
      "CECI",
      "Dandora and Mathare",
      "Baseline-to-curriculum journey",
      "Program coordination and stakeholder engagement",
      "Community networking",
      "Stakeholder introductions",
      "External partnerships",
      "Fundraising and relationship development",
    ],
    programmeIds: [CECI_ID],
    photo: volunteerPhoto("stephanie.jpg", "Stephanie Ndiritu"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "chika-atueyi",
    slug: "chika-atueyi",
    name: "Chika Atueyi",
    firstName: "Chika",
    role: "Volunteer Program Officer & JEET Project Lead",
    shortRole: "Program Officer (Volunteer), JEET Lead",
    teamFunction: "programs-partnerships-meal",
    bio: "Chika supports program development and implementation, including earlier design work on the Just & Equitable Energy Transition (JEET) concept. She also supports Stephanie in developing the Community Environmental Champions Initiative, helping connect planning, coordination and relevant training themes to SOEA's shared community-led approach. JEET is currently a thematic focus, not a standalone SOEA program.",
    relatedWork: [
      "Program coordination and stakeholder engagement",
      "Community networking",
      "Stakeholder introductions",
      "External partnerships",
      "Fundraising and relationship development",
    ],
    programmeIds: [CECI_ID],
    photo: volunteerPhoto("chika.jpeg", "Chika Atueyi"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "nahshon-omollo",
    slug: "nahshon-omollo",
    name: "Nahshon Omollo",
    firstName: "Nahshon",
    role: "Fundraising & Partnerships Volunteer",
    shortRole: "Fundraising & Partnerships (Volunteer)",
    teamFunction: "programs-partnerships-meal",
    bio: "Nahshon supports fundraising, partnerships and community relationships at SOEA. His contributions include connecting the organization with community members and external stakeholders, supporting dialogue and trust-building, and identifying collaborative opportunities. He helps align external relationships with community priorities and the organization's wider work on practical climate solutions.",
    relatedWork: [
      "Community networking",
      "Stakeholder introductions",
      "External partnerships",
      "Fundraising and relationship development",
    ],
    programmeIds: [],
    photo: volunteerPhoto("Nahshon.jpeg", "Nahshon Omollo"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "wairimu-maina",
    slug: "wairimu-maina",
    name: "Wairimu Maina",
    firstName: "Wairimu",
    role: "Volunteer, Program Support & Internal Management Systems",
    shortRole: "Program Support & Internal Systems (Volunteer)",
    teamFunction: "program-support",
    bio: "Wairimu supports SOEA's program deliverables and internal management systems, helping teams coordinate assignments, align activities with approved workplans and follow through on agreed milestones. Her work connects day-to-day organizational processes to dependable delivery, ensuring teams can identify what is needed, maintain oversight and keep multiple community-led initiatives moving together.",
    relatedWork: [
      "Cross-program delivery planning",
      "Implementation tracking",
      "Internal systems and coordination",
    ],
    programmeIds: [],
    photo: volunteerPhoto("wairimu.svg", "Wairimu Maina"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "diana-nyaruai",
    slug: "diana-nyaruai",
    name: "Diana Nyaruai",
    firstName: "Diana",
    role: "Finance & Administration Volunteer",
    shortRole: "Finance & Administration (Volunteer)",
    teamFunction: "finance-administration",
    bio: "Diana contributes to SOEA's finance and administration function, supporting accurate records, financial documentation, administrative coordination and effective people-management processes. Her work helps create the accountability and operational continuity that community programs require, from resource tracking to timely administrative support for project teams.",
    relatedWork: [
      "Finance records",
      "Administrative systems",
      "People-management support",
    ],
    programmeIds: [],
    photo: volunteerPhoto("diana.jpg", "Diana Nyaruai"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "speranza-wairimu",
    slug: "speranza-wairimu",
    name: "Speranza Wairimu",
    firstName: "Speranza",
    role: "Finance & Administration Volunteer",
    shortRole: "Finance & Administration (Volunteer)",
    teamFunction: "finance-administration",
    bio: "Speranza supports SOEA's finance and administration work by maintaining reliable expenditure records, internal controls, documentation and practical support for volunteers and programs. Her contribution helps keep financial processes accountable and organizational activities running smoothly, strengthening the systems that underpin community-led climate solutions.",
    relatedWork: [
      "Finance and administration",
      "Program expenditure support",
      "Personnel coordination and compliance documentation",
    ],
    programmeIds: [],
    photo: volunteerPhoto("speranza.jpg", "Speranza Wairimu"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "brian-kibugi",
    slug: "brian-kibugi",
    name: "Brian Kibugi",
    firstName: "Brian",
    role: "Information and Communications Technology (ICT) Volunteer",
    shortRole: "ICT & Software Development (Volunteer)",
    teamFunction: "ict",
    bio: "Brian supports SOEA's information and communications technology function, helping maintain website operations, internal technology tools and reliable digital communication across the organization. He also assists with internal communications and external visibility, connecting practical digital systems to the way SOEA documents, shares and coordinates its work with communities and partners.",
    relatedWork: [
      "Website maintenance",
      "Information and communications technology (ICT) support",
      "Internal digital communications",
      "Support to external-facing visibility",
    ],
    programmeIds: [],
    photo: volunteerPhoto("Kibugi.svg", "Brian Kibugi"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
  {
    id: "barbara-joe",
    slug: "barbara-joe",
    name: "Barbara Joe",
    firstName: "Barbara",
    role: "Information and Communications Technology (ICT) Support Volunteer",
    shortRole: "ICT & Software Development (Volunteer)",
    teamFunction: "ict",
    bio: "Barbara supports the information and communications technology (ICT) function alongside Brian, contributing to website and digital-support tasks while continuing her studies and developing practical experience. Her role brings an important learning dimension to SOEA's volunteer model, strengthening everyday technology support while building her own skills through applied work.",
    relatedWork: [
      "ICT support",
      "Student learning and digital tasks",
    ],
    programmeIds: [],
    photo: volunteerPhoto("barbara.jpeg", "Barbara Joe"),
    education: [],
    activities: [],
    email: null,
    funFact: null,
  },
];

export const boardIntro = {
  eyebrow: "Board & Governance",
  title: "Board of Directors",
  intro:
    "SOEA is guided by a five-member Board of Directors providing governance, strategic oversight and institutional stewardship. Board members bring complementary experience in sustainable development, financial management, social accountability, technology, media and advocacy. Beyond their core governance responsibilities, their expertise helps shape organizational systems, strengthen program quality and support the responsible growth of community-led climate solutions.",
  note: "The Board governs collectively; SOEA's volunteer team supports daily operations.",
};

const boardPhoto = (slug: string, name: string): PersonPhoto => ({
  src: `/assets/images/team/board/${slug}.jpg`,
  alt: `Portrait of ${name}`,
});

export const boardMembers: BoardMember[] = [
  {
    id: "rozalia-wangui-karanja",
    name: "Rozalia Wangui Karanja",
    title: "Board Chairperson & Founder",
    bio: "Rozalia founded Square One Eco Africa from a conviction that communities already hold knowledge, strengths and resources that deserve to shape their own development. Drawing on experience in communication, advocacy and systems-based community engagement, she guides SOEA's strategic direction and its integrated approach to eco-sustainable development, climate technology and storytelling. Her leadership centers community agency: moving beyond short-lived interventions toward practical solutions that communities can shape, use and sustain.",
    photo: boardPhoto("rozalia-wangui-karanja", "Rozalia Wangui Karanja"),
  },
  {
    id: "kelvin-waweru",
    name: "Kelvin Waweru",
    title: "Treasurer",
    bio: "Kelvin is a project management professional with more than 10 years of experience leading infrastructure and real estate projects valued at over USD 100 million. His professional development includes studies at the University of Nairobi, Columbia University, the London School of Economics and Strathmore University. As Treasurer, he strengthens SOEA's financial stewardship, budgeting, reporting, risk management and responsible resource mobilization, supporting the financial and administrative systems needed for transparent program delivery.",
    photo: boardPhoto("kelvin-waweru", "Kelvin Waweru"),
  },
  {
    id: "norah-nkirote-ireri",
    name: "Norah Nkirote Ireri",
    title: "Secretary",
    bio: "Norah brings more than 10 years of experience in media, creative production and strategic communications. She holds a BA in Conflict, Peace and Psychology and a Diploma in Mass Communication. In addition to her Board Secretary responsibilities, she contributes expertise in storytelling, advocacy and technology-enabled communication, helping SOEA document community experiences, strengthen multimedia content systems and translate locally led climate work into messages that inform public understanding and action.",
    photo: boardPhoto("norah-nkirote-ireri", "Norah Nkirote Ireri"),
  },
  {
    id: "joseph-kamande",
    name: "Joseph Kamande",
    title: "Board Member",
    bio: "Joseph is the CEO and Founder of Media Jos Productions Limited, with more than 10 years of experience in broadcast operations, digital content and strategic communication. His contribution to SOEA focuses on community-centered storytelling and advocacy, including visual documentation, documentary production, youth digital media skills and the use of credible narratives to engage partners, decision-makers and the wider public in climate action.",
    photo: boardPhoto("joseph-kamande", "Joseph Kamande"),
  },
  {
    id: "aima-sonia-otieno",
    name: "Aima Sonia Otieno",
    title: "Board Member",
    bio: "Aima is a governance and development practitioner specializing in social accountability and inclusive governance across East Africa. Her experience in the development and civil society space contributes to SOEA's program design and accountability systems. She brings perspectives on community scorecards, social audits, citizen-led monitoring and the practical connection between policy commitments and community realities, helping keep programs responsive, transparent and grounded in participation.",
    photo: boardPhoto("aima-sonia-otieno", "Aima Sonia Otieno"),
  },
];

export const founderLetter = {
  eyebrow: "A message from the Founder & Executive Lead",
  greeting: "Welcome to Square One Eco Africa.",
  paragraphs: [
    "SOEA was founded on a belief that has only grown stronger through our engagement with communities: sustainable change cannot be designed at a distance and delivered as a finished answer. It begins by listening, understanding what people already know, and making room for them to shape the choices, tools and opportunities that affect their lives.",
    "Across Africa, communities face overlapping challenges, climate shocks, environmental degradation, unequal access to resources and limited economic opportunities. Yet these same communities carry practical knowledge, creativity and a determination to build better futures. Our role is to connect that agency with partnerships, evidence, finance, innovation and meaningful opportunities for action.",
    "This is why our work sits at the meeting point of rural and urban sustainable development. Through Eco-Sustainable Development, we work toward practical, locally relevant solutions. Through Eco-Tech Innovation Hubs, we explore how technology and climate information can make those solutions more useful and accessible. Through Storytelling & Advocacy for Transformational Impact, we ensure that the people closest to these challenges can be heard, represented fairly and recognized as leaders of change.",
    "We are still building, learning and growing as an organization. That journey requires strong governance, an extraordinary commitment from our team, and relationships rooted in mutual respect. What matters most is that our ambitions translate into practical progress with communities, not simply into plans on paper.",
    "To community leaders, civil society organizations, public institutions, researchers, innovators, funders, businesses, volunteers and individuals who share this vision: there is space for you in this journey. Whether through knowledge, time, collaboration, resources or a shared idea worth testing, we welcome the opportunity to build together.",
    "Behind SOEA's day-to-day work is a committed team of volunteers who give their experience, energy and time to move this mission forward. I invite you to meet them below, and to become part of what we can accomplish together.",
  ],
  signature: "Rozalia Wangui Karanja",
  signatureTitle: "Founder & Executive Lead | Board Chairperson",
};

export const connectCopy = {
  eyebrow: "Connect with us",
  title: "Let us co-create what comes next.",
  body: "The climate challenges before us are too interconnected for any one organization or community to address alone. We welcome partners who believe in shared learning, practical action, community leadership and measurable change. If you have skills to contribute, an idea to explore, evidence to share or resources to help bring a promising solution to life, we would value a conversation.",
};

export const getVolunteerBySlug = (slug: string) =>
  volunteers.find((person) => person.slug === slug);

export const getVolunteersByFunction = (functionId: TeamFunctionId) =>
  volunteers.filter((person) => person.teamFunction === functionId);

export const getVolunteersByProgramme = (programmeId: string) =>
  volunteers.filter((person) => person.programmeIds.includes(programmeId));
