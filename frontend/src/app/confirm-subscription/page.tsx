import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import NewsletterAction from "@/components/newsletter/NewsletterAction";

export const metadata: Metadata = {
  title: "Confirm your subscription",
  // Personal links from our emails: keep them out of search engines.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        {/* The token comes from the URL (useSearchParams), which needs a Suspense boundary. */}
        <Suspense fallback={null}>
          <NewsletterAction action="confirm" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
