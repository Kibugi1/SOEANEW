import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import Journey from "@/components/journey/Journey";
import SectionHeader from "@/components/ui/SectionHeader";
import LinkButton from "@/components/ui/LinkButton";
import { SOCIAL, whatsappHref } from "@/components/ui/SocialLinks";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Connect with Square One Eco Africa to explore program partnerships, community engagement, research, technical collaboration, media opportunities and institutional support.",
};

const contacts = [
  { label: "General inquiries", value: "info@sq1ecoafrica.org", href: "mailto:info@sq1ecoafrica.org" },
  { label: "Partnerships & program inquiries", value: "partnerships@sq1ecoafrica.org", href: "mailto:partnerships@sq1ecoafrica.org" },
  {
    label: "Executive engagement",
    value: "r.karanja@sq1ecoafrica.org",
    note: "Rozalia Wangui Karanja, Founder & Executive Lead",
    href: "mailto:r.karanja@sq1ecoafrica.org",
  },
  { label: "WhatsApp", value: SOCIAL.whatsappDisplay, href: whatsappHref },
  { label: "LinkedIn", value: "Square One Eco Africa", href: SOCIAL.linkedin },
  { label: "Location", value: "Nairobi, Kenya" },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <Journey id="contact" />

        <Box component="section" aria-labelledby="contact-details-heading" sx={{ bgcolor: "background.subtle", py: { xs: 10, md: 14 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={{ xs: 6, md: 10 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <SectionHeader
                  titleId="contact-details-heading"
                  eyebrow="11 / Contact us"
                  title="Prefer to reach us directly?"
                  intro="Connect with Square One Eco Africa to explore program partnerships, community engagement, research, technical collaboration, media opportunities and institutional support."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Box component="dl" sx={{ m: 0 }}>
                  {contacts.map((item) => (
                    <Box key={item.label} sx={{ py: 2.5, borderBottom: 1, borderColor: "divider" }}>
                      <Typography component="dt" variant="eyebrow" sx={{ color: "primary.dark" }}>
                        {item.label}
                      </Typography>
                      <Box component="dd" sx={{ m: 0, mt: 0.5 }}>
                        {item.href ? (
                          <Box
                            component="a"
                            href={item.href}
                            {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            sx={{ fontSize: { xs: "1.05rem", md: "1.25rem" }, fontWeight: 600, color: "text.primary", "&:hover": { color: "primary.dark" } }}
                          >
                            {item.value}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: { xs: "1.05rem", md: "1.25rem" }, fontWeight: 600 }}>{item.value}</Typography>
                        )}
                        {item.note && (
                          <Typography sx={{ mt: 0.5, fontSize: "0.85rem", color: "text.secondary" }}>{item.note}</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 5 }}>
                  <Typography variant="h4" component="h3">
                    Stay connected
                  </Typography>
                  <Typography sx={{ mt: 1, color: "text.secondary" }}>
                    Subscribe to receive updates on community programs, research, partnerships and learning.
                  </Typography>
                  <LinkButton href="/stay-connected" variant="contained" sx={{ mt: 3 }}>
                    Subscribe
                  </LinkButton>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </main>
      <Footer />
    </>
  );
}
