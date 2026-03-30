import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
} from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

function statusBadge(status: string | null) {
  if (!status) return <Badge variant="outline" className="text-gray-400">No Plan</Badge>;
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-700 border-blue-200" },
    past_due: { label: "Past Due", className: "bg-red-100 text-red-700 border-red-200" },
    canceled: { label: "Canceled", className: "bg-gray-100 text-gray-500 border-gray-200" },
    incomplete: { label: "Incomplete", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return <Badge className={`${cfg.className} border text-xs font-semibold`}>{cfg.label}</Badge>;
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === "active" || status === "trialing") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "past_due") return <AlertCircle className="w-5 h-5 text-red-500" />;
  return <Clock className="w-5 h-5 text-gray-400" />;
}

export default function Billing() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const { data: sub, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: invoices = [], isLoading: invLoading } = trpc.stripe.getPaymentHistory.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your plan and view payment history.</p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : sub?.planName ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={sub.status} />
                  <div>
                    <div className="font-semibold text-gray-900">{sub.planName}</div>
                    <div className="text-xs text-gray-400">
                      {sub.currentPeriodEnd
                        ? `Next billing: ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`
                        : "Subscription active"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(sub.status)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-500">You don't have an active subscription.</div>
                <Link href="/get-started">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Plans
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No payments yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {inv.description ?? "SoloEdge Subscription"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(inv.created * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        ${(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                      </span>
                      <Badge
                        className={`text-xs border ${
                          inv.status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {inv.status}
                      </Badge>
                      {inv.hostedInvoiceUrl && (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade / Change Plan */}
        {sub?.status !== "active" && (
          <div className="text-center">
            <Link href="/get-started">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8">
                Get Started — View All Plans
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
