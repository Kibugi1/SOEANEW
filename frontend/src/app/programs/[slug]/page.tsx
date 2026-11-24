import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import BackLink from "@/components/people/BackLink";
import SimpleMarkdown from "@/components/ui/SimpleMarkdown";
import { focusAreas } from "@/data/focusAreas";
import { volunteers } from "@/data/people";
import { PROGRESS_LABELS, getDashboardProgram } from "@/lib/content/programs";

/*
 * A program published from the dashboard. CECI has its own hand-built page at
 * /programs/ceci, which takes precedence over this route. No generateStaticParams:
 * with Cache Components an empty list would fail the build before any program is
 * published, so the shell is static and the program streams in.
 */

const mono = {
  fontFamily: '"Space Mono", monospace',
  fontSize: "0.65rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
} as const;

const serif = { fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, color: "#1A1A1A" } as const;

const formatMonth = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: PageProps<"/programs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const program = await getDashboardProgram(slug);
  if (!program) return {};
  return { title: program.title, description: program.summary };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mt: { xs: 6, md: 8 } }}>
      <Typography component="h2" sx={{ ...mono, color: "#83834B", mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

async function ProgramContent({ params }: { params: PageProps<"/programs/[slug]">["params"] }) {
  const { slug } = await params;
  const program = await getDashboardProgram(slug);
  if (!program) notFound();

  const dates = [
    program.start_date && `Started ${formatMonth(program.start_date)}`,
    program.end_date && `Ends ${formatMonth(program.end_date)}`,
  ].filter(Boolean);
  const leadHref = program.lead && volunteers.some((v) => v.slug === program.lead!.slug)
    ? `/people-stories/${program.lead.slug}`
    : null;

  return (
    <>
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 } }}>
        <BackLink href={program.parent ? `/programs/${program.parent.slug}` : "/programs"}>
          {program.parent ? program.parent.title : "Programs"}
        </BackLink>

        <Typography sx={{ ...mono, color: "#83834B", mt: 4 }}>
          {[PROGRESS_LABELS[program.status], program.parent && `Project under ${program.parent.title}`]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
        <Typography component="h1" sx={{ ...serif, mt: 2, fontSize: { xs: 44, sm: 56, md: 72 }, lineHeight: 1.02 }}>
          {program.title}
        </Typography>
        <Typography sx={{ mt: 3, color: "#5F5F55", fontSize: { xs: 18, md: 21 }, lineHeight: 1.7, maxWidth: 820 }}>
          {program.summary}
        </Typography>
        {(dates.length > 0 || program.locations.length > 0) && (
          <Typography sx={{ mt: 2.5, color: "#5F5F55", fontSize: 14 }}>
            {[...dates, program.locations.map((l) => l.name).join(" · ")].filter(Boolean).join("  ·  ")}
          </Typography>
        )}
        {program.cta && (
          <Box sx={{ mt: 4 }}>
            {program.cta.url ? (
              <Button
                component="a"
                href={program.cta.url}
                variant="contained"
                endIcon={<ArrowOutwardRounded />}
                sx={{ bgcolor: "#83834B", "&:hover": { bgcolor: "#504624" } }}
              >
                {program.cta.label}
              </Button>
            ) : (
              <Chip label={`${program.cta.label} · coming soon`} variant="outlined" />
            )}
          </Box>
        )}
      </Container>

      {program.cover_image && (
        <Container maxWidth="lg" sx={{ mt: { xs: 5, md: 7 } }}>
          <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "21 / 9" }, bgcolor: "#EDEDE3", overflow: "hidden" }}>
            <Image
              src={program.cover_image.url}
              alt={program.cover_image.alt_text ?? ""}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1150px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </Box>
        </Container>
      )}

      <Container maxWidth="md" sx={{ pb: { xs: 10, md: 14 } }}>
        {program.body && (
          <Box sx={{ mt: { xs: 5, md: 7 } }}>
            <SimpleMarkdown text={program.body} />
          </Box>
        )}

        {program.sub_programs.length > 0 && (
          <Section title="Projects">
            <Stack spacing={1.5}>
              {program.sub_programs.map((p) => (
                <Link key={p.slug} href={`/programs/${p.slug}`} style={{ textDecoration: "none" }}>
                  <Box component="span" sx={{ ...serif, fontSize: 26, "&:hover": { color: "#504624" } }}>
                    {p.title} →
                  </Box>
                </Link>
              ))}
            </Stack>
          </Section>
        )}

        {program.partners.length > 0 && (
          <Section title="Partners">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              {program.partners.map((partner) => {
                const content = partner.logo ? (
                  <Box sx={{ position: "relative", height: 72 }}>
                    <Image
                      src={partner.logo.url}
                      alt={partner.logo.alt_text ?? `${partner.name} logo`}
                      fill
                      sizes="200px"
                      style={{ objectFit: "contain" }}
                      unoptimized
                    />
                  </Box>
                ) : (
                  <Typography sx={{ fontWeight: 600, color: "#1A1A1A", textAlign: "center" }}>{partner.name}</Typography>
                );
                return (
                  <Box
                    key={partner.slug}
                    {...(partner.website_url
                      ? { component: "a", href: partner.website_url, target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    title={partner.name}
                    sx={{
                      display: "grid",
                      alignItems: "center",
                      minHeight: 110,
                      p: 2,
                      border: "1px solid #E4E4DA",
                      bgcolor: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    {content}
                  </Box>
                );
              })}
            </Box>
          </Section>
        )}

        {(program.lead || program.contact_email) && (
          <Section title="Get in touch">
            {program.lead && (
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                {program.lead.image && (
                  <Box sx={{ position: "relative", width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                    <Image src={program.lead.image.url} alt="" fill sizes="64px" style={{ objectFit: "cover" }} unoptimized />
                  </Box>
                )}
                <Box>
                  <Typography sx={{ fontWeight: 600, color: "#1A1A1A" }}>
                    {leadHref ? (
                      <Link href={leadHref} style={{ color: "#504624" }}>{program.lead.display_name}</Link>
                    ) : (
                      program.lead.display_name
                    )}
                  </Typography>
                  {program.lead.role_title && (
                    <Typography sx={{ color: "#5F5F55", fontSize: 14 }}>{program.lead.role_title}</Typography>
                  )}
                </Box>
              </Stack>
            )}
            {program.contact_email && (
              <Typography sx={{ mt: program.lead ? 2 : 0 }}>
                <Box component="a" href={`mailto:${program.contact_email}`} sx={{ color: "#504624", fontWeight: 600 }}>
                  {program.contact_email}
                </Box>
              </Typography>
            )}
          </Section>
        )}

        {program.stories.length > 0 && (
          <Section title="Latest stories">
            <Stack spacing={1}>
              {program.stories.map((story) => (
                <Link key={story.slug} href={`/people-stories/stories/${story.slug}`} style={{ color: "#504624", fontWeight: 600 }}>
                  {story.title}
                </Link>
              ))}
            </Stack>
          </Section>
        )}

        {program.themes.length > 0 && (
          <Section title="Themes">
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {program.themes.map((theme) =>
                focusAreas.some((area) => area.slug === theme.slug) ? (
                  <Chip key={theme.slug} label={theme.name} component="a" href={`/our-focus/${theme.slug}`} clickable variant="outlined" />
                ) : (
                  <Chip key={theme.slug} label={theme.name} variant="outlined" />
                ),
              )}
            </Stack>
          </Section>
        )}
      </Container>
    </>
  );
}

export default function ProgramPage({ params }: PageProps<"/programs/[slug]">) {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<Box sx={{ minHeight: "100vh" }} />}>
          <ProgramContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
