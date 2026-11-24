import type { Metadata } from "next";
import LaunchReveal from "@/components/launch/LaunchReveal";

// A link to share: "We are live" → "We are Square One Eco Africa" → confetti → the new site.
const TITLE = "We are live: Square One Eco Africa";
const DESCRIPTION = "Our new website is live. Co-creating practical climate solutions for transformational impact.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/launch",
    siteName: "Square One Eco Africa",
    type: "website",
    images: [{ url: "/assets/images/launch/og.jpg", width: 1200, height: 630, alt: "We are live: Square One Eco Africa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/images/launch/og.jpg"],
  },
};

export default function LaunchPage() {
  return <LaunchReveal siteHref="/" />;
}
