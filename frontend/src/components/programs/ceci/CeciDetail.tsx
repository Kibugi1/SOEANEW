import Image from "next/image";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

import {
  JourneyState,
  ProjectLead,
  ceciLearningAreas,
  ceciPathways,
  ceciProgramme,
  ceciProjects,
  groundUpStory,
  guidedByPeople,
  jeetChampions,
  projectLeads,
  wpLift,
  wpLiftJourney,
} from "@/data/ceci";

const olive = "#83834B";
const ink = "#1A1A1A";
const muted = "#5F5F55";
const earth = "#504624";
const gold = "#D9AF3F";

/** Completed / underway / coming up / planned, so visitors can follow progress (feedback §1). */
const STATE_STYLE: Record<JourneyState, { label: string; bg: string; dot: string }> = {
  completed: { label: "Completed", bg: "#E6EDE3", dot: "#4F7A43" },
  underway: { label: "Underway", bg: "#E8E8DC", dot: olive },
  upcoming: { label: "Coming up", bg: "#F6EBC9", dot: gold },
  planned: { label: "Planned", bg: "#ECECE8", dot: "#9A9A8C" },
};

const headingSx = {
  fontFamily: '"Cormorant Garamond", serif',
  fontSize: { xs: 40, md: 60 },
  lineHeight: 1.04,
  fontWeight: 500,
  color: ink,
} as const;

function Eyebrow({ children, color = olive }: { children: React.ReactNode; color?: string }) {
  return (
    <Typography
      sx={{
        fontFamily: '"Space Mono", monospace',
        fontSize: "0.68rem",
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </Typography>
  );
}

function LeadCard({ lead }: { lead: ProjectLead }) {
  return (
    <Box sx={{ bgcolor: "#FFFFFF", p: { xs: 3, md: 4 }, display: "flex", gap: 3, flexDirection: { xs: "column", sm: "row" } }}>
      <Box sx={{ position: "relative", width: 140, height: 170, flexShrink: 0, bgcolor: "#F3F3EC" }}>
        <Image src={lead.photo.src} alt={lead.photo.alt} fill sizes="140px" style={{ objectFit: "cover" }} />
      </Box>
      <Stack spacing={1.5}>
        <Eyebrow>Project lead</Eyebrow>
        <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 34, lineHeight: 1.05, color: ink }}>
          {lead.name}
        </Typography>
        <Typography sx={{ color: muted, lineHeight: 1.6 }}>{lead.title}</Typography>
        <Box>
          <Button
            component="a"
            href={`mailto:${lead.email}`}
            variant="contained"
            startIcon={<MailOutlineRounded />}
            sx={{ bgcolor: earth, "&:hover": { bgcolor: olive }, textAlign: "left" }}
          >
            {lead.ctaLabel}
          </Button>
        </Box>
        <Typography sx={{ fontSize: 13, color: muted }}>
          {lead.email} ·{" "}
          <Link href={lead.profileHref} style={{ color: earth }}>
            Profile
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}

export default function CeciDetail() {
  const [wpLiftLead, jeetLead] = [
    projectLeads.find((l) => l.projectId === "wp-lift")!,
    projectLeads.find((l) => l.projectId === "jeet-champions")!,
  ];

  return (
    <>
      {/* Program overview */}
      <Box component="section" sx={{ bgcolor: "#F5F5EF", pt: { xs: 9, md: 15 }, pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          <Stack spacing={3} sx={{ maxWidth: 950 }}>
            <Eyebrow>Our programs / {ceciProgramme.shortName} · {ceciProgramme.label}</Eyebrow>
            <Typography
              component="h1"
              sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 46, sm: 62, md: 84 }, lineHeight: 0.98, fontWeight: 500, color: ink }}
            >
              {ceciProgramme.name} ({ceciProgramme.shortName})
            </Typography>
            <Typography sx={{ fontSize: { xs: 17, md: 21 }, color: muted, lineHeight: 1.8, maxWidth: 760 }}>
              {ceciProgramme.tagline}
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.9, maxWidth: 820 }}>{ceciProgramme.introduction}</Typography>
          </Stack>
        </Container>
      </Box>

      {/* Projects under CECI */}
      <Box component="section" aria-labelledby="ceci-projects" sx={{ py: { xs: 8, md: 11 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 5 }}>
            <Eyebrow>01 / Projects under CECI</Eyebrow>
            <Typography id="ceci-projects" component="h2" sx={headingSx}>
              One champions approach, adapted project by project.
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            {ceciProjects.map((project) => (
              <Box
                key={project.id}
                component="a"
                href={project.href}
                sx={{
                  display: "block",
                  p: { xs: 3, md: 4 },
                  textDecoration: "none",
                  color: "inherit",
                  bgcolor: project.statusTone === "underway" ? "#F5F5EF" : "#FFFFFF",
                  border: "1px solid #E5E5DD",
                  borderTop: `4px solid ${project.statusTone === "underway" ? olive : gold}`,
                  transition: "border-color 200ms ease",
                  "&:hover": { borderColor: olive },
                }}
              >
                <Eyebrow>{project.status}</Eyebrow>
                <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 34, md: 42 }, lineHeight: 1.05, color: ink, mt: 2 }}>
                  {project.shortName}
                </Typography>
                <Typography sx={{ color: earth, fontWeight: 600, mt: 0.5 }}>{project.name}</Typography>
                <Typography sx={{ color: muted, lineHeight: 1.8, mt: 2 }}>{project.summary}</Typography>
                <Typography sx={{ color: earth, fontWeight: 700, fontSize: 14, mt: 2.5, display: "inline-flex", gap: 0.75, alignItems: "center" }}>
                  Read about {project.shortName} <ArrowOutwardRounded sx={{ fontSize: 16 }} />
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* WP-LIFT */}
      <Box id="wp-lift" component="section" aria-labelledby="wp-lift-heading" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 }, scrollMarginTop: 90 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 10 }, alignItems: "center" }}>
            <Box sx={{ position: "relative", minHeight: { xs: 320, md: 540 }, overflow: "hidden", bgcolor: "#F3F3EC" }}>
              <Image
                src="/assets/images/community/ceciplanning.webp"
                alt="Community members taking part in CECI planning"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </Box>
            <Stack spacing={3}>
              <Eyebrow>02 / First flagship project</Eyebrow>
              <Typography id="wp-lift-heading" component="h2" sx={headingSx}>
                {wpLift.shortName}
              </Typography>
              <Typography sx={{ color: earth, fontWeight: 600, mt: -1 }}>{wpLift.name}</Typography>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>{wpLift.introduction}</Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, pt: 2, borderTop: "1px solid #E5E5DD" }}>
                <Box>
                  <Eyebrow>Proposed first cohort</Eyebrow>
                  <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 42, color: ink }}>{wpLift.plannedCohort}</Typography>
                  <Typography sx={{ color: muted, fontSize: 13 }}>Community champions</Typography>
                </Box>
                <Box>
                  <Eyebrow>Where</Eyebrow>
                  <Typography sx={{ color: ink, mt: 1, lineHeight: 1.6 }}>{wpLift.location}</Typography>
                </Box>
              </Box>

              {/* "Current focus" card, linking to the phases (feedback §7 and §9). */}
              <Box
                component="a"
                href="#wp-lift-journey"
                sx={{ display: "block", bgcolor: olive, color: "#FFFFFF", p: 2.5, textDecoration: "none", "&:hover": { bgcolor: earth } }}
              >
                <Eyebrow color="#F6EBC9">Current focus</Eyebrow>
                <Typography sx={{ fontWeight: 700, mt: 0.5 }}>{wpLift.currentFocus}</Typography>
                <Typography sx={{ fontSize: 13, mt: 0.5, opacity: 0.9 }}>See the project journey →</Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Featured story */}
      <Box component="section" sx={{ py: { xs: 9, md: 12 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: { xs: 4, md: 8 }, alignItems: "center" }}>
            <Box sx={{ position: "relative", minHeight: { xs: 280, md: 420 }, overflow: "hidden", bgcolor: "#F3F3EC" }}>
              <Image
                src={groundUpStory.photo.src}
                alt={groundUpStory.photo.alt}
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
                style={{ objectFit: "cover" }}
              />
            </Box>
            <Stack spacing={2.5}>
              <Eyebrow>{groundUpStory.eyebrow}</Eyebrow>
              <Typography component="h2" sx={{ ...headingSx, fontSize: { xs: 36, md: 50 } }}>
                {groundUpStory.title}
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>{groundUpStory.summary}</Typography>
              <Box>
                <Button component="a" href={groundUpStory.href} variant="outlined" endIcon={<ArrowOutwardRounded />}>
                  Follow the journey
                </Button>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* WP-LIFT journey and phases */}
      <Box id="wp-lift-journey" component="section" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 }, scrollMarginTop: 90 }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 820, mb: 5 }}>
            <Eyebrow>03 / The WP-LIFT journey</Eyebrow>
            <Typography component="h2" sx={headingSx}>
              What we have done, what is taking shape, and what comes next.
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, pt: 1 }}>
              {(Object.keys(STATE_STYLE) as JourneyState[]).map((state) => (
                <Box key={state} sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATE_STYLE[state].dot }} />
                  <Typography sx={{ fontSize: 13, color: earth }}>{STATE_STYLE[state].label}</Typography>
                </Box>
              ))}
            </Stack>
          </Stack>

          <Stack spacing={0}>
            {wpLiftJourney.map((step) => (
              <Box
                key={step.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "170px 1fr 300px" },
                  gap: 3,
                  py: 4,
                  borderTop: "1px solid #DCDCD1",
                  borderLeft: `4px solid ${STATE_STYLE[step.state].dot}`,
                  pl: { xs: 2, md: 3 },
                }}
              >
                <Box>
                  <Typography sx={{ fontFamily: '"Space Mono", monospace', color: olive, fontSize: 13 }}>{step.label}</Typography>
                  <Box sx={{ display: "inline-block", mt: 1.5, px: 1.5, py: 0.5, bgcolor: STATE_STYLE[step.state].bg }}>
                    <Typography sx={{ fontSize: 12, color: earth, fontWeight: 600 }}>{STATE_STYLE[step.state].label}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography component="h3" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: { xs: 28, md: 34 }, color: ink, lineHeight: 1.1, mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: earth, fontWeight: 600, mb: 1.5 }}>{step.period}</Typography>
                  <Typography sx={{ color: muted, lineHeight: 1.8 }}>{step.description}</Typography>
                </Box>
                {step.photo ? (
                  <Box sx={{ position: "relative", minHeight: 200, overflow: "hidden", bgcolor: "#F3F3EC" }}>
                    <Image
                      src={step.photo.src}
                      alt={step.photo.alt}
                      fill
                      sizes="(max-width: 900px) 100vw, 35vw"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                ) : (
                  <Box />
                )}
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Five specialized pathways */}
      <Box component="section" sx={{ py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 6 }}>
            <Eyebrow>04 / Five specialized pathways</Eyebrow>
            <Typography component="h2" sx={headingSx}>
              Learning through practical, material-based pathways.
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.8 }}>
              WP-LIFT’s evolving design brings together five material-based specializations, taught with safe
              waste-handling practices and alongside the core training below.
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 3 }}>
            {ceciPathways.map((pathway) => (
              <Box key={pathway.number}>
                <Box sx={{ position: "relative", height: { xs: 230, md: 260 }, overflow: "hidden", bgcolor: "#F3F3EC" }}>
                  <Image
                    src={pathway.photo.src}
                    alt={pathway.photo.alt}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: olive, mt: 3, mb: 1 }}>
                  PATHWAY {pathway.number}
                </Typography>
                <Typography component="h3" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 30, lineHeight: 1.1, color: ink, mb: 1.5 }}>
                  {pathway.title}
                </Typography>
                <Typography sx={{ color: muted, lineHeight: 1.8 }}>{pathway.description}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Core training */}
      <Box component="section" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 14 } }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ maxWidth: 760, mb: 6 }}>
            <Eyebrow>05 / Core training</Eyebrow>
            <Typography component="h2" sx={headingSx}>
              Eight cross-cutting learning areas.
            </Typography>
            <Typography sx={{ color: muted, lineHeight: 1.8 }}>
              Core training that every participant takes alongside the five specializations.
            </Typography>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
            {ceciLearningAreas.map((area, index) => (
              <Box
                key={area}
                sx={{
                  minHeight: 170,
                  p: 3,
                  bgcolor: "#FFFFFF",
                  borderTop: `2px solid ${gold}`,
                  transition: "background-color 280ms ease",
                  "&:hover": { bgcolor: olive },
                  "&:hover .core-number, &:hover .core-title": { color: "#FFFFFF" },
                  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                }}
              >
                <Typography className="core-number" sx={{ fontFamily: '"Space Mono", monospace', fontSize: 12, color: olive, mb: 4 }}>
                  0{index + 1}
                </Typography>
                <Typography className="core-title" sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, lineHeight: 1.2, color: ink }}>
                  {area}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Guided by the people */}
      <Box component="section" sx={{ py: { xs: 9, md: 12 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 5, alignItems: "center" }}>
            <Box>
              <Eyebrow>06 / Guided by the people</Eyebrow>
              <Typography component="h2" sx={{ ...headingSx, mt: 2, mb: 3 }}>
                Shaped by the people it serves.
              </Typography>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>{guidedByPeople}</Typography>
            </Box>
            <LeadCard lead={wpLiftLead} />
          </Box>
        </Container>
      </Box>

      {/* JEET Champions */}
      <Box id="jeet-champions" component="section" aria-labelledby="jeet-heading" sx={{ bgcolor: "#F5F5EF", py: { xs: 9, md: 13 }, scrollMarginTop: 90 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: { xs: 5, md: 8 }, alignItems: "start" }}>
            <Stack spacing={2.5}>
              <Eyebrow>07 / Developing project under CECI</Eyebrow>
              <Typography id="jeet-heading" component="h2" sx={headingSx}>
                {jeetChampions.shortName}
              </Typography>
              <Typography sx={{ color: earth, fontWeight: 600, mt: -1 }}>{jeetChampions.name}</Typography>
              <Box sx={{ display: "inline-flex", alignSelf: "flex-start", px: 1.5, py: 0.5, bgcolor: "#F6EBC9" }}>
                <Typography sx={{ fontSize: 13, color: earth, fontWeight: 700 }}>{jeetChampions.status}</Typography>
              </Box>
              <Typography sx={{ color: muted, lineHeight: 1.9 }}>{jeetChampions.introduction}</Typography>
              <Box sx={{ pt: 2, borderTop: "1px solid #E5E5DD" }}>
                <Eyebrow>{jeetChampions.pathway}</Eyebrow>
                <Typography sx={{ color: ink, mt: 1, lineHeight: 1.7 }}>{jeetChampions.places}</Typography>
              </Box>
              <Typography sx={{ color: muted, fontSize: 14, fontStyle: "italic" }}>{jeetChampions.conceptNote}</Typography>
            </Stack>
            <LeadCard lead={jeetLead} />
          </Box>
        </Container>
      </Box>

      {/* Partnership CTA */}
      <Box component="section" sx={{ bgcolor: earth, py: { xs: 9, md: 13 }, color: "#fff" }}>
        <Container maxWidth="xl">
          <Box sx={{ maxWidth: 850 }}>
            <Eyebrow color={gold}>08 / Partnerships</Eyebrow>
            <Typography component="h2" sx={{ ...headingSx, color: "#fff", fontSize: { xs: 42, md: 64 }, mt: 2, mb: 3 }}>
              Help shape the WP-LIFT curriculum.
            </Typography>
            <Typography sx={{ color: "#E8E5D9", lineHeight: 1.9, maxWidth: 700, mb: 4 }}>
              We welcome training institutions, technical experts, community organizations, circular economy
              actors and funding partners who can contribute to curriculum co-design, practical skills,
              certification, mentorship and livelihood opportunities.
            </Typography>
            <Button
              component="a"
              href="/programs/ceci/partnerships"
              variant="contained"
              endIcon={<ArrowOutwardRounded />}
              sx={{ bgcolor: gold, color: ink, "&:hover": { bgcolor: "#E6C45F" } }}
            >
              WP-LIFT curriculum co-design & partnerships
            </Button>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 4, textAlign: "center" }}>
        <Link href="/programs" style={{ color: olive, textDecoration: "none" }}>
          ← Back to all programs
        </Link>
      </Box>
    </>
  );
}
