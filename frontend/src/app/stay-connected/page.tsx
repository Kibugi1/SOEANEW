import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import Journey from "@/components/journey/Journey";

export const metadata: Metadata = {
  title: "Stay Connected",
  description: "Subscribe to updates on community programs, research, partnerships and learning.",
};

export default function StayConnectedPage() {
  return (
    <>
      <Navbar />
      <main>
        <Journey id="subscribe" queryPreset={{ param: "topic", field: "topics", multiple: true }} />
      </main>
      <Footer />
    </>
  );
}
