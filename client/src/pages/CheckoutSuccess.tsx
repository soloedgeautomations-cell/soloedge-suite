import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, Phone } from "lucide-react";
import { CDN } from "@shared/assets";

const TIER_NAMES: Record<string, string> = {
  "field-starter": "Field Starter",
  "field-pro": "Field Pro",
  "field-team": "Field Team",
  "sched-starter": "Scheduling Starter",
  "sched-pro": "Scheduling Pro",
  "sched-plus": "Scheduling Plus",
};

export default function CheckoutSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const tierId    = searchParams.get("tier") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";
  const isGuest   = searchParams.get("guest") === "1";

  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [magicAttempted, setMagicAttempted] = useState(false);

  // ── Logged-in path: poll until subscription becomes active ──────────────────
  const { data: sub, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user && !isGuest,
    refetchInterval: ready ? false : 3000,
  });

  useEffect(() => {
    if (sub?.status === "active" || sub?.status === "trialing") {
      setReady(true);
    }
  }, [sub]);

  // ── Guest path: poll for the magic login token, then auto-redirect ──────────
  // The Stripe webhook generates a short-lived JWT and stores it on the user
  // record. We poll /api/trpc/stripe.getMagicToken until it's ready, then
  // redirect to /api/auth/magic?token=... which sets the session cookie.
  const { data: magicData } = trpc.stripe.getMagicToken.useQuery(
    { sessionId },
    {
      enabled: isGuest && !!sessionId && !magicAttempted,
      refetchInterval: magicAttempted ? false : 3000,
      retry: 10,
    }
  );

  useEffect(() => {
    if (magicData?.token && !magicAttempted) {
      setMagicAttempted(true);
      window.location.href = `/api/auth/magic?token=${encodeURIComponent(magicData.token)}`;
    }
  }, [magicData, magicAttempted]);

  const tierName = TIER_NAMES[tierId] ?? "your plan";

  if (authLoading && !isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-10 text-center">
        {/* Logo */}
        <img src={CDN.logoSymbol} alt="SoloEdge" className="h-14 mx-auto mb-6" />

        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to SoloEdge!
        </h1>
        <p className="text-gray-500 mb-6">
          Your <span className="font-semibold text-gray-800">{tierName}</span> subscription
          is being activated. Riley AI is getting ready for you.
        </p>

        {/* Status indicator */}
        {isGuest ? (
          <div className="flex flex-col items-center gap-2 mb-6">
            {magicAttempted ? (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Logging you in…
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up your account…
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              You'll be taken to your dashboard automatically.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            {subLoading || !ready ? (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating your account…
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Account activated!
              </div>
            )}
          </div>
        )}

        {/* What's next */}
        <div className="bg-blue-50 rounded-xl p-4 text-left mb-6 space-y-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
            What happens next
          </p>
          <p className="text-sm text-gray-600">✅ Riley AI is configured for your business</p>
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
            Your dedicated Riley number will appear in your dashboard
          </p>
          <p className="text-sm text-gray-600">✅ Welcome email sent to your inbox</p>
          <p className="text-sm text-gray-600">📞 Onboarding call within 24 hours</p>
        </div>

        {/* CTA */}
        {isGuest ? (
          <p className="text-xs text-gray-400">
            Not redirected automatically?{" "}
            <a href="/get-started" className="text-blue-600 hover:underline">
              Return to pricing
            </a>
          </p>
        ) : (
          <Link href="/app">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Session: {sessionId.slice(0, 20)}…
        </p>
      </div>
    </div>
  );
}
