import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Crown, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { CDN } from "@shared/assets";

// Icon map per tier
const TIER_ICONS: Record<string, React.ElementType> = {
  "field-starter": Zap,
  "field-pro": Shield,
  "field-team": Crown,
  "sched-starter": Zap,
  "sched-pro": Shield,
  "sched-plus": Crown,
};

const SUITE_COLORS: Record<string, string> = {
  communication: "from-blue-600 to-cyan-500",
  scheduling: "from-green-600 to-emerald-400",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function GetStarted() {
  const { user } = useAuth();
  const [activeSuite, setActiveSuite] = useState<"communication" | "scheduling">("communication");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: tiers = [], isLoading } = trpc.stripe.getTiers.useQuery();
  const createCheckout = trpc.stripe.createCheckout.useMutation();
  const createGuestCheckout = trpc.stripe.createGuestCheckout.useMutation();

  const filteredTiers = tiers.filter((t) => t.suite === activeSuite);

  async function handleGetStarted(tierId: string) {
    setCheckingOut(tierId);
    toast.info("Redirecting to secure checkout…");
    try {
      if (user) {
        // Logged-in path: attach existing account to the checkout session
        const { url } = await createCheckout.mutateAsync({
          tierId,
          origin: window.location.origin,
        });
        window.open(url, "_blank");
      } else {
        // Guest path: no login required — account is created automatically after payment
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
            <img src={CDN.logo} alt="SoloEdge" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/app">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline" size="sm">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="container py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            TEST MODE — Use card 4242 4242 4242 4242
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Started with SoloEdge
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choose your plan. One-time setup fee + monthly subscription.
            Cancel anytime. Your Riley AI assistant is ready in minutes.
          </p>
        </div>

        {/* Suite Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveSuite("communication")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSuite === "communication"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Communication Suite
            </button>
            <button
              onClick={() => setActiveSuite("scheduling")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSuite === "scheduling"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Scheduling Suite
            </button>
          </div>
        </div>

        {/* Tier Cards */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {filteredTiers.map((tier) => {
              const Icon = TIER_ICONS[tier.id] ?? Zap;
              const gradient = SUITE_COLORS[tier.suite];
              const isLoading = checkingOut === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col ${
                    tier.popular
                      ? "border-blue-500 shadow-xl shadow-blue-100"
                      : "border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white text-xs px-3 py-1 shadow-md">
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
                        <div className="font-bold text-lg leading-tight">{tier.name}</div>
                        <div className="text-white/75 text-xs">{tier.subtitle}</div>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{tier.description}</p>
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
                      + {formatPrice(tier.setupAmount)} one-time setup fee
                    </div>
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
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      onClick={() => handleGetStarted(tier.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening Checkout…</>
                      ) : (
                        <><ExternalLink className="w-4 h-4 mr-2" />Get Started</>
                      )}
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Secure checkout via Stripe
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-gray-400">
          <span>🔒 256-bit SSL encryption</span>
          <span>💳 Powered by Stripe</span>
          <span>📞 Cancel anytime</span>
          <span>🤖 Riley AI included in every plan</span>
        </div>

        {/* Already have an account */}
        {!user && (
          <p className="text-center text-sm text-gray-400 mt-8">
            Already a customer?{" "}
            <a href={getLoginUrl()} className="text-blue-600 hover:underline font-medium">
              Sign in to your dashboard →
            </a>
          </p>
        )}
      </main>
    </div>
  );
}
