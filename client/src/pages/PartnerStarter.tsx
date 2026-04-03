import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Mail } from "lucide-react";

const FEATURES = [
  "Dedicated Riley phone number",
  "AI Receptionist (24/7 call answering)",
  "Basic translation (English/Spanish/Chinese)",
  "Light email help",
  "Simple Google Calendar booking",
];

export default function PartnerStarter() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="section-pad bg-white relative overflow-hidden">
        <div className="max-w-xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 tracking-wide uppercase">
            Partner Program
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Partner Starter
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto mb-8">
            Help sell SoloEdge &amp; get your own AI receptionist for almost nothing.
          </p>

          {/* Pricing card — same style as PricingSection */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-left">
            {/* Price */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Get your own AI receptionist for a very low price.</p>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-sm text-gray-400 mb-1">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">$79.19 one-time setup fee</p>
            </div>

            {/* Features */}
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Includes</p>
            <ul className="space-y-2 mb-6">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Check size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Special deal */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Special Deal</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Sell just <strong>ONE</strong> full SoloEdge package (Starter, Pro, or Premium) and we will give you your first Partner Starter <strong>free for 3 months</strong> — no setup fee, no monthly fee.
              </p>
            </div>

            {/* CTA button — same style as pricing page */}
            <a
              href="mailto:hello@soloedgeautomations.com?subject=Interested%20in%20Partner%20Starter&body=Hi%2C%20I%27m%20interested%20in%20the%20Partner%20Starter%20program.%20Please%20send%20me%20more%20details."
              className="inline-flex items-center justify-center w-full gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Mail size={15} />
              I'm Interested in Partner Starter →
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
