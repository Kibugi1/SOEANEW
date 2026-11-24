import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import Journey from "@/components/journey/Journey";
import BackLink from "@/components/people/BackLink";
import PageIntro from "@/components/ui/PageIntro";

export const metadata: Metadata = {
  title: "WP-LIFT: Curriculum Co-Design & Partnerships | Under CECI",
  description:
    "Help co-design the WP-LIFT curriculum with waste pickers in Dandora and Mathare, under the Community Environmental Champions Initiative (CECI).",
};

/**
 * Accent per interest area (feedback 19 Nov 2026, §9). The SOEA logo file is greyscale,
 * so these are shades of the site's brand palette (olive, earth, gold); swap in the
 * official brand colors once confirmed.
 */
const AREA_COLORS = ["#83834B", "#504624", "#D9AF3F", "#6F703E", "#A8A658", "#B8862B", "#3F4A2A"];

/** docs/consolidated-guide.pdf §05B. */
const areas = [
  { title: "Curriculum & Certification", body: "Training institutions, technical and vocational education and training providers, curriculum designers and assessment specialists." },
  { title: "Practical Skills & Circular Enterprise", body: "Facilitators in textile upcycling, organic waste recovery, composting, black soldier fly systems, glass upcycling, plastics, product design and enterprise development." },
  { title: "Legal Rights & Paralegal Training", body: "Legal practitioners and community justice organizations supporting awareness of labor rights, environmental rights, contracts, legal identity, access to justice and dispute resolution." },
  { title: "Health, Safety & Safeguarding", body: "Occupational health and safety specialists, first-aid trainers, medical professionals and institutions supporting personal protective equipment, risk assessments, safe equipment use and safety marshal training." },
  { title: "Financial Literacy & Access to Finance", body: "Financial institutions and specialists supporting savings, financial planning, responsible borrowing, enterprise readiness and access to appropriate financing." },
  { title: "Markets & Livelihood Opportunities", body: "Businesses, aggregators, manufacturers, cooperatives and employers offering mentorship, practical experience, market linkages and enterprise opportunities." },
  { title: "Research, Monitoring & Learning", body: "Researchers and technical partners supporting training assessments, evidence collection, program evaluation and outcome tracking." },
];

export default function CeciPartnershipsPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageIntro
          before={<BackLink href="/programs/ceci">Community Environmental Champions Initiative (CECI)</BackLink>}
          eyebrow="WP-LIFT · Under CECI"
          title="WP-LIFT: Curriculum Co-Design & Partnerships"
          intro="We are bringing together partners to co-develop a practical training curriculum with waste pickers in Dandora and Mathare, Nairobi County, as part of WP-LIFT, the first flagship project under the Community Environmental Champions Initiative."
        />

        {/* "Current focus" card linking to the project phases (feedback §9). */}
        <Container maxWidth="xl" sx={{ pb: { xs: 5, md: 7 } }}>
          <Box
            component="a"
            href="/programs/ceci#wp-lift-journey"
            sx={{
              display: "inline-block",
              bgcolor: "#83834B",
              color: "#FFFFFF",
              px: 3,
              py: 2.5,
              textDecoration: "none",
              "&:hover": { bgcolor: "#504624" },
            }}
          >
            <Typography sx={{ fontFamily: '"Space Mono", monospace', fontSize: "0.68rem", letterSpacing: "0.13em", color: "#F6EBC9" }}>
              CURRENT FOCUS
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mt: 0.5 }}>
              October 2026 – March 2027: curriculum co-design &amp; partnerships
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", mt: 0.5, opacity: 0.9 }}>
              See the project phases, starting with Phase 0 planning →
            </Typography>
          </Box>
        </Container>

        <Box component="section" aria-label="Partnership areas" sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {areas.map((area, index) => (
                <Grid key={area.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Box
                    sx={{
                      height: "100%",
                      p: 3,
                      border: 1,
                      borderColor: "divider",
                      borderTop: `5px solid ${AREA_COLORS[index]}`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="eyebrow" sx={{ color: "primary.dark", fontWeight: 700 }}>
                      {String(index + 1).padStart(2, "0")}
                    </Typography>
                    <Typography variant="h4" component="h2" sx={{ mt: 1, fontSize: "1.5rem" }}>
                      {area.title}
                    </Typography>
                    <Typography sx={{ mt: 1.5, fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.7 }}>
                      {area.body}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box id="express-interest" sx={{ bgcolor: "background.subtle", borderTop: 1, borderColor: "divider" }}>
          <Container maxWidth="xl" sx={{ pt: { xs: 8, md: 10 } }}>
            <Typography variant="h2" component="h2">
              Let&rsquo;s build the curriculum together
            </Typography>
          </Container>
          <Journey id="partnership" preset={{ programme: "ceci-001" }} />
        </Box>
      </main>
      <Footer />
    </>
  );
}
