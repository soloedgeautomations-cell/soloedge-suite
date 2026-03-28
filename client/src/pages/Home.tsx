import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import IndustriesSection from "@/components/IndustriesSection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(0.09_0.012_240)]">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <IndustriesSection />
      <PricingSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
