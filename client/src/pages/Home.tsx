import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AuditSection from "@/components/AuditSection";
import AIOSSection from "@/components/AIOSSection";
import ServicesSection from "@/components/ServicesSection";
import IndustriesSection from "@/components/IndustriesSection";
import PricingSection from "@/components/PricingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FloatingRiley from "@/components/FloatingRiley";
import FloatingCTA from "@/components/FloatingCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <AuditSection />
      <AIOSSection />
      <ServicesSection />
      <IndustriesSection />
      <PricingSection />
      <ContactSection />
      <Footer />
      <FloatingRiley />
      <FloatingCTA />
    </div>
  );
}
