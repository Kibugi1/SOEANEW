import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How Square One Eco Africa collects, uses and protects the personal information you share through this website, and the rights you have over it.",
};

const LAST_UPDATED = "24 November 2026";

/*
 * Written to match what the site and API actually do (backend/app/models/forms.py,
 * api/v1/forms.py, services/notifications.py). If those change, update this page.
 */
const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        Square One Eco Africa (SOEA) is a Kenyan organization based in Nairobi. We are responsible for the
        personal information you share through this website. We handle it in line with the Kenya Data
        Protection Act, 2019.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect, and when",
    body: (
      <>
        <p>We only collect what you choose to send us through the forms on this site:</p>
        <ul>
          <li>
            <strong>Partnership enquiries:</strong> your name, email, phone (optional), organization, the areas
            you&rsquo;re interested in, what you could contribute, and your message.
          </li>
          <li>
            <strong>Volunteer applications:</strong> your name, email, phone (optional), the area you&rsquo;d like to
            help with, your skills, availability and motivation.
          </li>
          <li>
            <strong>Contact messages:</strong> your name, email, phone (optional), organization (optional), the topic and
            your message.
          </li>
          <li>
            <strong>Newsletter sign-up:</strong> your email address, the date you confirmed, and the version of the
            consent wording you agreed to.
          </li>
        </ul>
        <p>
          With each message we also record the page you sent it from and that you gave consent. We do not store
          your IP address with your message.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it",
    body: (
      <>
        <ul>
          <li>To reply to your enquiry, application or message, and to follow up on it.</li>
          <li>To consider you for volunteer roles or partnership opportunities you asked about.</li>
          <li>To send you our newsletter, only if you subscribed and confirmed by email.</li>
          <li>To keep the site safe, for example by limiting how many messages can be sent in a short time.</li>
        </ul>
        <p>
          We use your information because you consented when you ticked the box on the form. We do not sell or
          rent your personal information, and we do not use it for advertising.
        </p>
      </>
    ),
  },
  {
    id: "who-sees-it",
    title: "Who can see it",
    body: (
      <>
        <p>
          Your message is stored in SOEA&rsquo;s secure admin inbox. Only SOEA staff who handle that type of
          message can open it. When a message arrives, the relevant team inbox gets an email alert. That alert
          contains your name, your organization and a reference number, but not your message.
        </p>
        <p>
          We use trusted service providers to run this site and send email, such as our hosting provider and
          Google Workspace. They process information only on our behalf. We do not share your details with
          other partners without asking you first, unless the law requires us to.
        </p>
      </>
    ),
  },
  {
    id: "how-long",
    title: "How long we keep it",
    body: (
      <p>
        We keep enquiries and applications only for as long as we need them to respond, to work with you, or to
        meet our legal and reporting obligations. After that, we delete them. Newsletter subscribers stay on
        our list until they unsubscribe.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and tracking",
    body: (
      <p>
        This website does not use advertising or analytics cookies, and it does not track you across other
        sites, so there is no cookie banner. The staff sign-in area stores a temporary sign-in token in the
        browser, and that token is cleared when the tab is closed. The links to LinkedIn and WhatsApp take you to
        those services, which have their own privacy policies.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the Kenya Data Protection Act, 2019, you can ask us to:</p>
        <ul>
          <li>tell you what personal information we hold about you and give you a copy;</li>
          <li>correct information that is wrong or incomplete;</li>
          <li>delete your information, or stop using it;</li>
          <li>stop sending you the newsletter. Every newsletter email has an unsubscribe link.</li>
        </ul>
        <p>
          To ask, email{" "}
          <a href="mailto:info@sq1ecoafrica.org?subject=Privacy%20request">info@sq1ecoafrica.org</a> with the subject
          &ldquo;Privacy request&rdquo;. If you have a reference number (for example SOEA-CO-XXXXXX), include it. We
          will reply as soon as we can. If you are unhappy with how we handled your information, you can complain
          to the{" "}
          <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">
            Office of the Data Protection Commissioner
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "stories-and-photos",
    title: "Stories and photos",
    body: (
      <p>
        Stories and photos of community members on this site are shared with the knowledge of the people in
        them. If you appear on this site and would like something changed or removed, email{" "}
        <a href="mailto:info@sq1ecoafrica.org?subject=Story%20or%20photo%20request">info@sq1ecoafrica.org</a> and we
        will act on it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this notice",
    body: (
      <p>
        We may update this notice as our work and this website change. The date at the top shows when it last
        changed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main>
        <Box component="section" aria-labelledby="privacy-heading" sx={{ pt: { xs: 16, md: 20 }, pb: { xs: 10, md: 14 } }}>
          <Container maxWidth="md">
            <SectionHeader
              level="h1"
              titleId="privacy-heading"
              eyebrow="Privacy notice"
              title="How we look after your information"
              intro={`Last updated ${LAST_UPDATED}`}
            />

            <Alert severity="info" variant="outlined" sx={{ mt: 5, borderRadius: 0, alignItems: "flex-start" }}>
              <AlertTitle sx={{ fontWeight: 700 }}>The short version</AlertTitle>
              We collect only what you send us through our forms, and only with your consent. We use it to respond to
              you and, if you subscribe, to send you our newsletter. We never sell it. You can ask us to see, correct or
              delete it at any time by emailing info@sq1ecoafrica.org.
            </Alert>

            <Box component="nav" aria-label="On this page" sx={{ mt: 5 }}>
              <Typography variant="eyebrow" component="p" sx={{ color: "primary.dark", mb: 1.5 }}>
                On this page
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5, columns: { sm: 2 }, "& li": { mb: 0.75 }, "& a": { color: "text.primary" } }}>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </Box>
            </Box>

            {sections.map((section) => (
              <Box
                key={section.id}
                component="section"
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                sx={{
                  mt: 6,
                  scrollMarginTop: 100,
                  "& p, & li": { color: "text.secondary", lineHeight: 1.85, fontSize: "1rem" },
                  "& p": { mt: 0, mb: 2 },
                  "& ul": { pl: 2.5, mt: 0, mb: 2 },
                  "& li": { mb: 1 },
                  "& strong": { color: "text.primary" },
                  "& a": { color: "primary.dark", fontWeight: 600 },
                }}
              >
                <Typography id={`${section.id}-heading`} variant="h4" component="h2" sx={{ mb: 2 }}>
                  {section.title}
                </Typography>
                {section.body}
              </Box>
            ))}
          </Container>
        </Box>
      </main>
      <Footer />
    </>
  );
}
