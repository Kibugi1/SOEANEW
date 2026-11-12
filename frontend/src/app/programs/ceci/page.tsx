import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import CeciDetail from "@/components/programs/ceci/CeciDetail";

export default function CeciPage() {
  return (
    <>
      <Navbar />
      <main>
        <CeciDetail />
      </main>
      <Footer />
    </>
  );
}
