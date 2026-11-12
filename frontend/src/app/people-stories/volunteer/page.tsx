import type { Metadata } from "next";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import Journey from "@/components/journey/Journey";

export const metadata: Metadata = {
  title: "Volunteer With Us",
  description: "Join Square One Eco Africa's volunteer-led team.",
};

export default function VolunteerPage() {
  return (
    <>
      <Navbar />
      <main>
        <Journey id="volunteer" />
      </main>
      <Footer />
    </>
  );
}
