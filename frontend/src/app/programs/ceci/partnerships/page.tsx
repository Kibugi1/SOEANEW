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
  title: "CECI Phase 1 Partnerships",
  description: "Help shape the first Community Champions curriculum for waste pickers in Dandora and Mathare.",
};

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
          before={<BackLink href="/programs/ceci">CECI</BackLink>}
          eyebrow="05B / CECI: Phase 1 partnerships"
          title="Help shape the first Community Champions curriculum"
          intro="Current focus: October 2026 – March 2027. We are bringing together partners to co-develop a practical training curriculum for waste pickers and environmental workers in Dandora and Mathare."
        />

        <Box component="section" aria-label="Partnership areas" sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              {areas.map((area, index) => (
                <Grid key={area.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Box sx={{ height: "100%", p: 3, border: 1, borderColor: "divider", borderRadius: 1 }}>
                    <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
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
