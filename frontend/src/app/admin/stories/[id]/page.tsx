"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Button, Skeleton, Stack } from "@mui/material";
import StoryEditor from "@/components/admin/stories/StoryEditor";
import { ApiError, apiData } from "@/lib/admin/api";
import type { AdminStory } from "@/lib/admin/stories";

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<AdminStory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiData<AdminStory>(`/admin/stories/${id}`)
      .then((data) => !cancelled && setStory(data))
      .catch((caught) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This story does not exist, or it is not yours to see."
            : caught instanceof ApiError
              ? caught.message
              : "Could not load the story.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} href="/admin/stories">Back to stories</Button>
      </Stack>
    );
  }
  if (!story) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={56} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }
  // key: a fresh editor when moving between stories.
  return <StoryEditor key={story.id} story={story} />;
}
