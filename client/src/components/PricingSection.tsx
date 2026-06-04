import { ArrowRight, Phone } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

// Pricing section reworked 2026-06-05. AI receptionist subscription pricing removed (conflicted with
// SoloCommand install-+-retainer positioning). This section now functions as the post-Audit hand-off:
// it tells visitors the install + retainer conversation happens AFTER the Audit, not on the homepage.
export default function PricingSection() {
  return (
    <section id="pricing" className="section-pad bg-white relative overflow-hidden">
      <SectionBackground overlayClass="bg-white/72" offset={6} />

      <div className="container relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
          What comes after the Audit
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
          The Audit tells us what to build.<br className="hidden md:block" /> SoloCommand is what we build.
        </h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          After the Audit, we walk through your install and retainer pricing together. No surprise quotes. No committee. The Audit fee credits toward your install if you sign within 30 days.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
          <a
            href="#audit"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            Start Your Audit
            <ArrowRight size={15} />
          </a>
          <a
            href="tel:+15127029685"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            <Phone size={14} />
            Call Murphy. (512) 702-9685
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          No long calls. No committee. Murphy answers.
        </p>
      </div>
    </section>
  );
}
