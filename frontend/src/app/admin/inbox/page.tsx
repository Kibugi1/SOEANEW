import { Suspense } from "react";
import InboxList from "./InboxList";

export default function InboxPage() {
  // The filters live in the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <InboxList />
    </Suspense>
  );
}
