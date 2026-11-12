"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Story, StoryStatus } from "@/data/stories";

const statusLabel: Record<StoryStatus, string> = {
  completed: "Completed",
  current: "In progress",
  planned: "Planned",
};

type StoryTimelineProps = {
  stories: Story[];
  /** Heading level for each story title. */
  headingLevel?: "h2" | "h3" | "h4";
};

/** Vertical journey of dated program milestones. */
export default function StoryTimeline({ stories, headingLevel = "h3" }: StoryTimelineProps) {
  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
      {stories.map((story, index) => {
        const isLast = index === stories.length - 1;
        const isCurrent = story.status === "current";

        return (
          <Box
            component="li"
            key={story.id}
            id={story.slug}
            sx={{
              position: "relative",
              pl: { xs: 5, md: 7 },
              pb: isLast ? 0 : { xs: 6, md: 8 },
              "&::before": {
                content: '""',
                position: "absolute",
                left: { xs: 7, md: 11 },
                top: 10,
                bottom: isLast ? "auto" : 0,
                height: isLast ? 0 : "auto",
                width: "1px",
                bgcolor: "divider",
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: 0,
                top: 4,
                width: { xs: 15, md: 23 },
                height: { xs: 15, md: 23 },
                borderRadius: "50%",
                border: 2,
                borderColor: isCurrent ? "secondary.main" : "primary.main",
                bgcolor: story.status === "completed" ? "primary.main" : "background.default",
              }}
            />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
              <Typography variant="eyebrow" sx={{ color: "primary.dark" }}>
                {story.dateLabel}
              </Typography>
              <Chip
                label={statusLabel[story.status]}
                size="small"
                variant={isCurrent ? "filled" : "outlined"}
                color={isCurrent ? "secondary" : "default"}
                sx={{ height: 22, fontSize: "0.7rem" }}
              />
            </Stack>
            <Typography component={headingLevel} variant="h4" sx={{ mt: 1.5, fontSize: { xs: "1.6rem", md: "2rem" } }}>
              {story.title}
            </Typography>
            <Typography sx={{ mt: 1.5, maxWidth: "66ch", color: "text.secondary", lineHeight: 1.85 }}>
              {story.summary}
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: "0.85rem", color: "text.secondary" }}>
              {[story.community.join(" & "), story.phase].filter(Boolean).join(" · ")}
            </Typography>
            {story.nextStep && (
              <Typography sx={{ mt: 1, fontSize: "0.85rem" }}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Next step:{" "}
                </Box>
                {story.nextStep}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
