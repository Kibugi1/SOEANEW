import Image from "next/image";
import Link from "next/link";
import { Box, Container, Typography } from "@mui/material";
import { PROGRESS_LABELS, getDashboardPrograms } from "@/lib/content/programs";

const mono = {
  fontFamily: '"Space Mono", monospace',
  fontSize: "0.65rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
} as const;

/**
 * Programs published from the dashboard (everything except the hand-built CECI pages).
 * Renders nothing until there is at least one.
 */
export default async function MorePrograms() {
  const programs = await getDashboardPrograms();
  if (programs.length === 0) return null;

  return (
    <Box
      component="section"
      aria-labelledby="more-programs"
      sx={{ pb: { xs: 10, md: 16 } }}
    >
      <Container maxWidth="xl">
        <Typography sx={{ ...mono, color: "#83834B" }}>
          More of our work
        </Typography>
        <Typography
          id="more-programs"
          component="h2"
          sx={{
            mt: 1.5,
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: { xs: 36, md: 48 },
            lineHeight: 1.05,
            fontWeight: 500,
            color: "#1A1A1A",
          }}
        >
          Programs and projects
        </Typography>

        <Box
          sx={{
            "& .program-card": {
              display: "block",
              textDecoration: "none",
              color: "inherit",
            },
            "& .program-card:focus-visible": {
              outline: "3px solid #83834B",
              outlineOffset: 4,
            },
            mt: { xs: 4, md: 6 },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(3, 1fr)",
            },
            gap: { xs: 4, md: 5 },
          }}
        >
          {programs.map((program) => (
            <Link
              key={program.slug}
              href={`/programs/${program.slug}`}
              className="program-card"
            >
              <Box
                sx={{
                  "&:hover .cover img": { transform: "scale(1.03)" },
                  "&:hover h3": { color: "#504624" },
                }}
              >
                <Box
                  className="cover"
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    bgcolor: "#EDEDE3",
                  }}
                >
                  {program.cover_image ? (
                    <Image
                      src={program.cover_image.url}
                      alt={program.cover_image.alt_text ?? ""}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      unoptimized
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                      aria-hidden
                    >
                      <Typography
                        sx={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: 56,
                          color: "#83834B",
                          opacity: 0.6,
                        }}
                      >
                        {program.short_name ??
                          program.title
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography sx={{ ...mono, color: "#83834B", mt: 2.5 }}>
                  {[
                    PROGRESS_LABELS[program.status],
                    program.parent && `Project under ${program.parent.title}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
                <Typography
                  component="h3"
                  sx={{
                    mt: 1,
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: { xs: 28, md: 32 },
                    lineHeight: 1.1,
                    fontWeight: 500,
                    color: "#1A1A1A",
                    transition: "color 0.2s ease",
                  }}
                >
                  {program.title}
                </Typography>
                <Typography sx={{ mt: 1.5, color: "#5F5F55", lineHeight: 1.8 }}>
                  {program.summary}
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
