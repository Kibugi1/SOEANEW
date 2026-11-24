export type FocusArea = {
  number: string;
  title: string;
  slug: string;
  image: string;
  description: string;
  peopleServed: string[];
  learningTrack: string;
  /** Panel heading for `learningTrack`; defaults to "CECI learning track". */
  learningTrackLabel?: string;
  evidence: string;
  /** Related projects and pages (feedback 19 Nov 2026, §4.5). */
  related?: { label: string; href: string }[];
};

export const focusAreas: FocusArea[] = [
  {
    number: "01",
    title: "Circular Economy & Waste Management",
    slug: "circular-economy",
    image: "/assets/images/community/rozaliaconferencepresenting.webp",
    description:
      "We work with informal-sector workers and communities to strengthen sustainable waste management practices, improve resource recovery, promote circular economy innovations, and develop practical skills and sustainable livelihood opportunities that lead to transformational impact.",
    peopleServed: [
      "Informal-sector workers",
      "Waste pickers",
      "Communities involved in waste management",
    ],
    learningTrack:
      "WP-LIFT (Waste Pickers’ Livelihood Improvement for Transformation), the first flagship project under the Community Environmental Champions Initiative (CECI), is co-designing a practical training pathway with waste pickers in Dandora and Mathare: five specializations (organic waste composting, plastic recycling and upcycling, glass recovery and cutting, e-waste management, and textile recovery and upcycling) alongside occupational health and safety, legal rights advocacy, financial literacy and entrepreneurship. Curriculum co-design is planned for October 2026 to March 2027.",
    evidence:
      "Completed in 2026: community grounding and baseline assessment in Dandora and Mathare, findings presented to Nairobi City County officers, and the inaugural Waste Pickers Super Day on 10 October 2026, which brought together more than 80 waste pickers.",
    related: [{"label": "The CECI journey", "href": "/programs/ceci"}, {"label": "WP-LIFT project", "href": "/programs/ceci#wp-lift"}],
  },
  {
    number: "02",
    title: "Gender-Responsive Climate Resilience",
    slug: "gender-responsive-climate-resilience",
    image: "/assets/images/community/gender.webp",
    description:
      "We integrate gender-responsive approaches into community assessments, skills development, leadership and livelihood opportunities, responding to different needs and barriers experienced by women and men.",
    peopleServed: [
      "Women and men in participating communities",
      "Community groups",
      "People facing different barriers to skills and livelihood opportunities",
    ],
    learningTrack:
      "Gender equality, inclusion and safeguarding is a core learning area across CECI projects. JEET Champions, a developing CECI project, will prioritize women, including women with disabilities, in its first electric mobility pathway.",
    evidence:
      "Emerging area. SOEA’s published articles, videos and social posts on gender-responsive climate resilience, such as our International Women’s Day 2026 engagement in Mathare, will be linked here once verified.",
    related: [{"label": "JEET Champions", "href": "/programs/ceci#jeet-champions"}],
  },
  {
    number: "03",
    title: "Climate-Smart Agriculture & Agroforestry",
    slug: "climate-smart-agriculture",
    image: "/assets/images/community/tractor.webp",
    description:
      "We work with farming and pastoral communities in arid and semi-arid lands (ASALs) and rural areas to promote climate-smart agriculture, sustainable rangeland management, and agrosilvopastoral practices. We strengthen ecosystem restoration, soil health, and sustainable livelihoods while exploring opportunities in carbon markets and climate finance that deliver transformational impact.",
    peopleServed: [
      "Smallholder farmers",
      "Pastoral communities",
      "Rural communities in ASAL and other rural areas",
    ],
    learningTrack:
      "Emerging area. Our intended approach brings CECI’s community-led training together with practical decision support from Taarifa Eco (farm zoning, savings and localized early warning) for farming and pastoral communities.",
    evidence:
      "Concept and partnership work is under way, including SOEA’s participation in the Kenya Youth in Agrifood Systems Summit 2026. Project details will be added as the work develops.",
    related: [{"label": "Taarifa Eco", "href": "/innovation"}],
  },
  {
    number: "04",
    title: "Blue Economy & Coastal Resilience",
    slug: "blue-economy",
    image: "/assets/images/community/blueeconomy.webp",
    description:
      "We work towards community-led training and practical solutions that support coastal livelihoods, resource stewardship, marine ecosystem protection and resilience.",
    peopleServed: [
      "Coastal communities",
      "People whose livelihoods are connected to coastal resources",
    ],
    learningTrack:
      "Emerging area. Our intended approach applies CECI’s community-led training to coastal livelihoods and resource stewardship in SOEA’s coastal counties of focus: Mombasa, Kwale and Kilifi.",
    evidence:
      "SOEA’s published articles, videos and social posts on the blue economy and coastal resilience will be linked here once verified.",
  },
  {
    number: "05",
    title: "Just & Equitable Energy Transition",
    slug: "energy-transition",
    image: "/assets/images/community/justenergy.webp",
    description:
      "Our Just & Equitable Energy Transition work advances inclusive access to renewable energy and cleaner mobility as communities and economies move away from dependence on fossil fuels. Across rural areas, we explore how accessible renewable energy can strengthen livelihoods, productive activities, essential services and local enterprise. In urban centers, our electric mobility focus connects cleaner transport with new employment opportunities, reduced air pollution and lower transport-related carbon emissions, aligned with Kenya’s National Electric Mobility Policy. Through practical skills, informed participation, financing pathways and community advocacy, we aim to ensure women, young people, persons with disabilities and underserved communities can help shape—and benefit from—the energy transition.",
    peopleServed: [
      "Community members participating in relevant training",
      "People pursuing clean-energy skills and green-enterprise opportunities",
      "Practitioners involved in relevant infrastructure pathways",
    ],
    learningTrack:
      "JEET Champions is an emerging project under the Community Environmental Champions Initiative, using SOEA’s community-led training methodology to widen participation in renewable energy and electric mobility. Its initial electric mobility pathway will prioritize women, while including youth and persons with disabilities, and explore opportunities connected to ride-hailing, passenger vehicles and boda boda transport. Participants will build practical knowledge, confidence, advocacy skills and understanding of the livelihood and enterprise opportunities linked to cleaner mobility. The project will also promote informed community engagement with renewable energy solutions and the economic possibilities they can create.",
    learningTrackLabel: "JEET Champions · Concept in development",
    evidence:
      "Concept and partnership work so far includes an engagement with the National Council for Nomadic Education in Kenya (NACONEK) and the national workshop on data for clean cooking in schools (27 July 2026).",
    related: [{"label": "JEET Champions under CECI", "href": "/programs/ceci#jeet-champions"}],
  },
  {
    number: "06",
    title: "Climate Tech Innovation, Data Tools & Early Warning Systems",
    slug: "climate-technology",
    image: "/assets/images/community/climatedata.webp",
    description:
      "SOEA’s EcoTech Innovation Hubs connect community knowledge with practical climate technologies, digital tools and local innovation. Our developing Taarifa Eco application brings together layers of climate and early warning information, community savings and digital financial inclusion, adaptation financing, participatory land-use information and zoning, and practical decisions for farming, grazing, rangeland restoration and ecosystem resilience. Designed with rural and climate-vulnerable communities, the platform is intended to turn timely information into concrete local action and stronger livelihoods. As the prototype develops, Taarifa Eco will inform the growth of community-centered EcoTech Innovation Hubs that support learning, innovation and practical solutions across SOEA’s areas of focus.",
    peopleServed: [
      "Communities using climate information",
      "Community practitioners and program participants",
      "People involved in community reporting and skills tracking",
    ],
    learningTrack:
      "Taarifa Eco is a prototype in development, not yet a public application. It brings together climate and early warning information, community savings and digital financial inclusion, adaptation financing, and participatory land-use information and zoning, and will inform the growth of community-centered EcoTech Innovation Hubs.",
    learningTrackLabel: "Taarifa Eco · Prototype in development",
    evidence:
      "CECI develops people’s skills and community champions; Taarifa Eco develops enabling technology and decision support. Both connect through co-design, evidence and the ambition for community-owned solutions.",
    related: [{"label": "Taarifa Eco", "href": "/innovation"}],
  },
];

export const focusAnchor = {
  /** Formal name (feedback 19 Nov 2026, §4.1). */
  title: "Rural–Urban Sustainable Development",
  /** Display form for the headline graphic: the two-way movement between settings. */
  displayTitle: "Rural ↔ Urban",
  description:
    "Our overarching thematic focus is Rural–Urban Sustainable Development: connecting the people, livelihoods, ecosystems and opportunities that move between rural communities and urban centers. In rural and arid and semi-arid settings, we work with underserved, marginalized and climate-vulnerable communities, including farmers and pastoralists, to strengthen resilience, natural resource stewardship and sustainable livelihoods. In urban settings, we engage informal-sector workers, including waste pickers and small-scale traders, to expand skills, safer work, resource recovery and economic opportunities. Through community-led co-creation, we build practical climate solutions that respond to local realities across both settings and deliver transformational impact.",
  image: "/assets/images/community/connectedchallenges.webp",
};

/** §4.2 */
export const themesIntro = {
  title: "Six cross-cutting thematic areas of focus",
  description:
    "Our work is guided by six cross-cutting thematic areas of focus that bring environmental stewardship, equitable opportunities and practical innovation into the communities where we work. These areas inform the design of our CECI champions projects, our climate technology solutions, and the partnerships and evidence needed to create lasting results across rural and urban settings.",
};

/** §4.3 */
export const theoryOfChange = {
  headline:
    "Co-creating with communities, we deliver practical climate solutions that lead to transformational impact.",
  body:
    "Our approach starts with community priorities and combines locally relevant training, income-generation opportunities, legal rights advocacy, social and communication skills, occupational health and safety, financial literacy, entrepreneurship and market linkages. Alongside this learning and livelihood pathway, we integrate climate technology through EcoTech Innovation Hubs and innovations such as Taarifa Eco, connecting early warning information, community savings, finance and land-use knowledge to practical adaptation decisions. We strengthen the skills, knowledge, resources, motivation and leadership that enable communities to keep implementing, earning, advocating and adapting beyond SOEA’s direct project involvement. Lasting impact is reflected in community agency, resilient livelihoods and solutions that people can sustain, replicate and scale.",
};

/** §4.4 */
export const sharedCommitment =
  "Our shared commitment is to co-create with communities and place people at the center of every solution, from identifying priorities to shaping implementation and measuring results. Through practical learning, livelihood development and climate-tech innovation, including Taarifa Eco and our EcoTech Innovation Hubs, we connect local knowledge with relevant skills, information, resources and opportunities. We aim to strengthen livelihoods, economic activity, environmental resilience and community leadership so that the work continues, grows and creates transformational impact beyond our direct involvement.";
