import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import ThemeRegistry from "@/components/providers/ThemeRegistry";

export const metadata: Metadata = {
  title: {
    default: "Square One Eco Africa | Practical Climate Solutions",
    template: "%s | Square One Eco Africa",
  },
  description:
    "Co-creating practical climate solutions for transformational impact. People. Skills. Solutions. Sustainable Livelihoods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
