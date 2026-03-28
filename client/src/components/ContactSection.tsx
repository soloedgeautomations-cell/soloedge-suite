import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Phone, Mail, MessageSquare, CheckCircle } from "lucide-react";

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
    <section id="contact" className="section-pad bg-[oklch(0.11_0.013_240/0.5)]">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5">
                GET STARTED
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                {t.contact.title}
              </h2>
              <p className="text-lg text-white/55 leading-relaxed mb-8">
                {t.contact.subtitle}
              </p>

              {/* Contact info */}
              <div className="space-y-4">
                <a href="tel:+1-800-SOLOEDGE" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
                    <Phone size={16} className="text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">soloedgeautomations.com</span>
                </a>
                <a href="mailto:hello@soloedgeautomations.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-600/25 transition-colors">
                    <Mail size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium">hello@soloedgeautomations.com</span>
                </a>
                <div className="flex items-center gap-3 text-white/60">
                  <div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-500/20 flex items-center justify-center">
                    <MessageSquare size={16} className="text-green-400" />
                  </div>
                  <span className="text-sm font-medium">Response within 24 hours</span>
                </div>
              </div>
            </div>

            {/* Right — Form */}
            <div className="glass rounded-2xl p-7">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/55 text-sm">{t.contact.success}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contact.name} *</label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contact.phone}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contact.email}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contact.businessType}</label>
                    <select
                      value={form.businessType}
                      onChange={e => setForm(f => ({ ...f, businessType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[oklch(0.13_0.015_240)]">Select your industry...</option>
                      {BUSINESS_TYPES.map(bt => (
                        <option key={bt} value={bt} className="bg-[oklch(0.13_0.015_240)]">{bt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">{t.contact.message}</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all resize-none"
                      placeholder="Tell us about your business and what you need help with..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitLead.isPending}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
                  >
                    {submitLead.isPending ? "Sending..." : t.contact.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
