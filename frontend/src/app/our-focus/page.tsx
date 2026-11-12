import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import FocusHero from "@/components/focus/FocusHero";
import AnchorArea from "@/components/focus/AnchorArea";
import ThematicAreas from "@/components/focus/ThematicAreas";
import SharedCommitment from "@/components/focus/SharedCommitment";
import FocusCTA from "@/components/focus/FocusCTA";

export default function OurFocusPage() {
  return (
    <>
      <Navbar />
      <main>
        <FocusHero />
        <AnchorArea />
        <ThematicAreas />
        <SharedCommitment />
        <FocusCTA />
      </main>
      <Footer />
    </>
  );
}
