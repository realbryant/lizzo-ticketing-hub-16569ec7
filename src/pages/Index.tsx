import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import EventsSection from "@/components/EventsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
