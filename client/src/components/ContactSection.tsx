import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Phone, Mail, MessageSquare, CheckCircle } from "lucide-react";
import SectionBackground from "@/components/SectionBackground";

const BUSINESS_TYPES = [
  "General Contractor / Construction",
  "Gym / Fitness Studio",
  "Massage / Spa",
  "Restaurant / Food Service",
  "Corporate / Office",
  "Other",
];

export default function ContactSection() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", email: "", businessType: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const langLabel = lang === "es" ? "Spanish" : lang === "zh" ? "Chinese" : "English";
    submitLead.mutate({ ...form, language: langLabel, source: "website-contact" });
  };

  return (
    <section id="contact" className="section-pad bg-gray-50 relative overflow-hidden">
      <SectionBackground overlayClass="bg-gray-50/72" offset={9} />
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left — info */}
            <div className="glass rounded-2xl p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-5 tracking-wide uppercase">
                Get in Touch
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {t.contact.title}
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {t.contact.subtitle}
              </p>

              {/* Phone — primary, prominent */}
              <a
                href="tel:+17372595692"
                className="flex items-center gap-4 mb-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:bg-blue-700 transition-colors">
                  <Phone size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{t.contact.demoLabel}</p>
                  <p className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    {t.contact.demoNumber}
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:hello@soloedgeautomations.com"
                className="flex items-center gap-4 mb-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                  <Mail size={18} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Email</p>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-cyan-700 transition-colors">
                    hello@soloedgeautomations.com
                  </p>
                </div>
              </a>

              {/* Response time */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
                  <MessageSquare size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Response time</p>
                  <p className="text-sm font-medium text-gray-700">Within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Right — Form */}
            <div className="glass rounded-2xl p-7">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent</h3>
                  <p className="text-gray-500 text-sm">{t.contact.success}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.contact.name} *</label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.contact.phone}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.contact.email}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.contact.businessType}</label>
                    <select
                      value={form.businessType}
                      onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                    >
                      <option value="">Select your industry...</option>
                      {BUSINESS_TYPES.map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{t.contact.message}</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      placeholder="What's taking up the most time in your day?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitLead.isPending}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-blue-200"
                  >
                    {submitLead.isPending ? "Sending..." : t.contact.submit}
                  </button>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    Prefer to talk? Call us at{" "}
                    <a href="tel:+15127029685" className="text-blue-600 font-medium hover:underline">
                      (512) 702-9685
                    </a>
                  </p>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
