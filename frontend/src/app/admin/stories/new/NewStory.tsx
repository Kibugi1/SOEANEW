"use client";

import { useSearchParams } from "next/navigation";
import StoryEditor from "@/components/admin/stories/StoryEditor";

export default function NewStory() {
  const type = useSearchParams().get("type") === "event" ? "event" : "story";
  return <StoryEditor key={type} story={null} initialType={type} />;
}
