import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/layout/Footer";
import WhereWeWorkPage from "@/components/where-we-work/WhereWeWorkPage";

export default function WhereWeWork() {
  return (
    <>
      <Navbar />
      <main>
        <WhereWeWorkPage />
      </main>
      <Footer />
    </>
  );
}
