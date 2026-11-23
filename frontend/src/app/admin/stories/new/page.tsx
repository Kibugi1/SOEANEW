import { Suspense } from "react";
import NewStory from "./NewStory";

export default function NewStoryPage() {
  // ?type=event needs a Suspense boundary (useSearchParams).
  return (
    <Suspense>
      <NewStory />
    </Suspense>
  );
}
