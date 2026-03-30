import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { CDN } from "@shared/assets";

export default function CheckoutSuccess() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const tierId = searchParams.get("tier") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";

  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);

  const { data: sub, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: ready ? false : 3000, // poll until subscription is activated
  });

  useEffect(() => {
    if (sub?.status === "active" || sub?.status === "trialing") {
      setReady(true);
    }
  }, [sub]);

  const tierNames: Record<string, string> = {
    "field-starter": "Field Starter",
    "field-pro": "Field Pro",
    "field-team": "Field Team",
    "sched-starter": "Scheduling Starter",
    "sched-pro": "Scheduling Pro",
    "sched-plus": "Scheduling Plus",
  };
  const tierName = tierNames[tierId] ?? "your plan";

  if (authLoading) {
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
          Your <span className="font-semibold text-gray-800">{tierName}</span> subscription is being activated.
          Riley AI is getting ready for you.
        </p>

        {/* Activation status */}
        {subLoading || !ready ? (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            Activating your account…
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Account activated!
          </div>
        )}

        {/* What's next */}
        <div className="bg-blue-50 rounded-xl p-4 text-left mb-6 space-y-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">What happens next</p>
          <p className="text-sm text-gray-600">✅ Riley AI is configured for your business</p>
          <p className="text-sm text-gray-600">✅ You'll receive a welcome email shortly</p>
          <p className="text-sm text-gray-600">✅ Your dashboard is ready to use</p>
          <p className="text-sm text-gray-600">📞 Onboarding call within 24 hours</p>
        </div>

        <Link href="/app">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          Session ID: {sessionId.slice(0, 20)}…
        </p>
      </div>
    </div>
  );
}
