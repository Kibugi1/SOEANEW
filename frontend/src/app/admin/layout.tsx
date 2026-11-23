import { Suspense } from "react";
import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  // The dashboard is private: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // AdminShell reads the URL (usePathname). Under dynamic routes such as
  // /admin/stories/[id] that read happens at request time, so Next.js requires a
  // Suspense boundary; the dashboard is client-rendered either way.
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
