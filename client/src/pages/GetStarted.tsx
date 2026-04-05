import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Zap, Shield, Crown, Loader2, ExternalLink, Phone, Calendar,
  MessageSquare, BarChart2, Slack, Users, Star
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { CDN } from "@shared/assets";

const TIER_ICONS: Record<string, React.ElementType> = {
  starter: Zap,
  pro: Shield,
  premium: Crown,
};

const TIER_GRADIENTS: Record<string, string> = {
  starter: "from-slate-600 to-slate-500",
  pro: "from-blue-600 to-sky-500",
  premium: "from-violet-700 to-purple-500",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

// Feature comparison table data
const COMPARISON_FEATURES = [
  { label: "AI call answering 24/7", starter: true, pro: true, premium: true },
  { label: "Lead capture & text alerts", starter: true, pro: true, premium: true },
  { label: "English + Spanish support", starter: true, pro: true, premium: true },
  { label: "Voicemail transcription", starter: true, pro: true, premium: true },
  { label: "Basic email assistance", starter: true, pro: true, premium: true },
  { label: "Industry-tuned AI personality", starter: false, pro: true, premium: true },
  { label: "Full appointment scheduling", starter: false, pro: true, premium: true },
  { label: "EN / ES / ZH trilingual support", starter: false, pro: true, premium: true },
  { label: "Automated lead follow-up", starter: false, pro: true, premium: true },
  { label: "No-show reduction reminders", starter: false, pro: true, premium: true },
  { label: "Weekly performance reports", starter: false, pro: true, premium: true },
  { label: "Fully custom AI scripts", starter: false, pro: false, premium: true },
  { label: "Slack integration", starter: false, pro: false, premium: true },
  { label: "Up to 3 extra phone numbers", starter: false, pro: false, premium: true },
  { label: "Advanced ROI & usage reports", starter: false, pro: false, premium: true },
  { label: "Multi-location support", starter: false, pro: false, premium: true },
  { label: "Dedicated onboarding specialist", starter: false, pro: false, premium: true },
  { label: "Priority phone & Slack support", starter: false, pro: false, premium: true },
];

export default function GetStarted() {
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: tiers = [], isLoading } = trpc.stripe.getTiers.useQuery();
  const createCheckout = trpc.stripe.createCheckout.useMutation();
  const createGuestCheckout = trpc.stripe.createGuestCheckout.useMutation();

  async function handleGetStarted(tierId: string) {
    setCheckingOut(tierId);
    toast.info("Redirecting to secure checkout…");
    try {
      if (user) {
        const { url } = await createCheckout.mutateAsync({
          tierId,
          origin: window.location.origin,
        });
        window.open(url, "_blank");
      } else {
        const { url } = await createGuestCheckout.mutateAsync({
          tierId,
          origin: window.location.origin,
        });
        window.open(url, "_blank");
      }
    } catch (err) {
      toast.error("Could not start checkout. Please try again.");
      console.error(err);
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <img src={CDN.logoTransparent} alt="SoloEdge Automations" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/app">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Riley is live and answering calls right now
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pick your plan. Riley starts today.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            One-time setup fee + simple monthly subscription. No contracts. Cancel anytime.
            Your AI receptionist is ready in minutes.
          </p>
        </div>

        {/* Tier Cards */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => {
              const Icon = TIER_ICONS[tier.id] ?? Zap;
              const gradient = TIER_GRADIENTS[tier.id] ?? "from-slate-600 to-slate-500";
              const isProcessing = checkingOut === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col ${
                    tier.popular
                      ? "border-blue-500 shadow-xl shadow-blue-100 scale-[1.02]"
                      : "border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white text-xs px-3 py-1 shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className={`p-6 rounded-t-2xl bg-gradient-to-br ${gradient} text-white`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xl leading-tight">{tier.name}</div>
                        <div className="text-white/75 text-xs font-medium">{tier.subtitle}</div>
                      </div>
                    </div>
                    <p className="text-white/85 text-sm leading-relaxed">{tier.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(tier.monthlyAmount)}
                      </span>
                      <span className="text-gray-400 text-sm">/month</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      + {formatPrice(tier.setupAmount)} one-time setup
                    </div>
                    {tier.popular && (
                      <div className="mt-2 text-xs text-blue-600 font-semibold">
                        Best value for growing businesses
                      </div>
                    )}
                    {tier.id === "premium" && (
                      <div className="mt-2 text-xs text-violet-600 font-semibold">
                        Full concierge — nothing left out
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="px-6 py-5 flex-1">
                    <ul className="space-y-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-6">
                    <Button
                      className={`w-full font-semibold ${
                        tier.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : tier.id === "premium"
                          ? "bg-violet-700 hover:bg-violet-800 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      onClick={() => handleGetStarted(tier.id)}
                      disabled={!!checkingOut}
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening Checkout…</>
                      ) : (
                        <><ExternalLink className="w-4 h-4 mr-2" />Get Started</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Secure checkout via Stripe · Cancel anytime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Toggle */}
        <div className="max-w-5xl mx-auto mt-10 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
          >
            {showComparison ? "Hide" : "See full"} feature comparison →
          </button>
        </div>

        {/* Feature Comparison Table */}
        {showComparison && (
          <div className="max-w-5xl mx-auto mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
              <div className="p-4 text-sm font-semibold text-gray-500">Feature</div>
              <div className="p-4 text-sm font-bold text-gray-900 text-center">Starter</div>
              <div className="p-4 text-sm font-bold text-blue-600 text-center bg-blue-50">Pro ⭐</div>
              <div className="p-4 text-sm font-bold text-violet-700 text-center">Premium</div>
            </div>
            {COMPARISON_FEATURES.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <div className="p-3.5 text-sm text-gray-600">{row.label}</div>
                <div className="p-3.5 flex justify-center items-center">
                  {row.starter
                    ? <Check className="w-4 h-4 text-green-500" />
                    : <span className="text-gray-300 text-lg leading-none">—</span>}
                </div>
                <div className="p-3.5 flex justify-center items-center bg-blue-50/30">
                  {row.pro
                    ? <Check className="w-4 h-4 text-blue-500" />
                    : <span className="text-gray-300 text-lg leading-none">—</span>}
                </div>
                <div className="p-3.5 flex justify-center items-center">
                  {row.premium
                    ? <Check className="w-4 h-4 text-violet-500" />
                    : <span className="text-gray-300 text-lg leading-none">—</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* What's included in every plan */}
        <div className="max-w-5xl mx-auto mt-14">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-8">
            Every plan includes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Phone,         label: "Dedicated Riley Phone Number",        desc: "Your own dedicated phone number that Riley answers 24/7. No sharing, no confusion." },
              { icon: MessageSquare, label: "SMS & Call Notifications",            desc: "Instant SMS alerts for every call, booking, or lead. Know what's happening immediately. (Telegram support coming soon)" },
              { icon: Calendar,      label: "Google Calendar Appointment Setting", desc: "Riley books appointments directly into your Google Calendar in real time. No double-bookings, no manual entry needed." },
              { icon: BarChart2,     label: "Monthly Summary Report",              desc: "Clear monthly report showing calls answered, leads captured, appointments booked, and time saved." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-800 font-semibold mb-1">{label}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-gray-400">
          <span>🔒 256-bit SSL encryption</span>
          <span>💳 Powered by Stripe</span>
          <span>📞 Cancel anytime</span>
          <span>🤖 Riley AI included in every plan</span>
          <span>⚡ Live in minutes</span>
        </div>

        {/* Already have an account */}
        {!user && (
          <p className="text-center text-sm text-gray-400 mt-8">
            Already a customer?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in to your dashboard →
            </Link>
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-10">
        <p className="text-center text-xs text-gray-400">
          Powered by{" "}
          <a href="https://soloedgeautomations.com" className="hover:text-gray-600 underline" target="_blank" rel="noopener noreferrer">
            SoloEdge Automations
          </a>
          {" "}· Questions?{" "}
          <a href="mailto:support@soloedge.app" className="hover:text-gray-600 underline">
            support@soloedge.app
          </a>
        </p>
      </footer>
    </div>
  );
}
