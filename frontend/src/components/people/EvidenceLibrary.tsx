"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import type { EvidenceCategory, EvidenceResource } from "@/data/stories";

type EvidenceLibraryProps = {
  categories: EvidenceCategory[];
  resources: EvidenceResource[];
};

/** Evidence categories with the resources filed under each. */
export default function EvidenceLibrary({ categories, resources }: EvidenceLibraryProps) {
  return (
    <Box component="section" aria-label="Evidence library" sx={{ pb: { xs: 10, md: 14 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          {categories.map((category, index) => {
            const items = resources.filter((resource) => resource.categoryId === category.id);
            const headingId = `evidence-${category.id}`;

            return (
              <Grid key={category.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Box
                  component="section"
                  aria-labelledby={headingId}
                  sx={{
                    height: "100%",
                    p: { xs: 3, md: 4 },
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: items.length ? "background.subtle" : "background.default",
                  }}
                >
                  <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography id={headingId} variant="h4" component="h2" sx={{ mt: 1, fontSize: "1.6rem" }}>
                    {category.name}
                  </Typography>
                  {items.length > 0 ? (
                    <Stack component="ul" spacing={2} sx={{ mt: 3, p: 0, listStyle: "none" }}>
                      {items.map((item) => (
                        <Box component="li" key={item.id} sx={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                          {item.href ? (
                            <Box
                              component="a"
                              href={item.href}
                              sx={{ color: "text.primary", display: "inline-flex", gap: 0.5, alignItems: "flex-start" }}
                            >
                              {item.title}
                              <ArrowOutwardRoundedIcon sx={{ fontSize: 16, mt: 0.4 }} />
                            </Box>
                          ) : (
                            <>
                              {item.title}
                              <Typography component="span" sx={{ display: "block", mt: 0.5, fontSize: "0.8rem", color: "text.secondary" }}>
                                Publication pending
                              </Typography>
                            </>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ mt: 3, fontSize: "0.875rem", color: "text.secondary" }}>
                      Resources will be added as they are reviewed and approved.
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
