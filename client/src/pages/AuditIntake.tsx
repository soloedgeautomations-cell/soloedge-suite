import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { AUDIT_TIER_MAP, formatAuditPrice } from "@shared/auditTiers";
import { CDN } from "@shared/assets";

export default function AuditIntake() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id") ?? "";
  const tierId = searchParams.get("tier") ?? "";
  const tier = AUDIT_TIER_MAP[tierId];

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    preferredTimes: "",
    notes: "",
  });

  const submitIntake = trpc.audit.submitIntake.useMutation();

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      toast.error("Missing payment confirmation — please contact Murphy directly at (512) 702-9685.");
      return;
    }
    try {
      await submitIntake.mutateAsync({
        sessionId,
        tierId,
        ...form,
      });
      setSubmitted(true);
    } catch (err) {
      toast.error("Something went wrong submitting your info — call (512) 702-9685 and Murphy will get you sorted directly.");
      console.error(err);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-5" />
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">You're on the calendar.</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Murphy's got your info and your preferred times. No committee, no ticket queue —
            he'll personally confirm your exact appointment time within 24 hours.
          </p>
          <a
            href="tel:+15127029685"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Phone size={14} /> Need to talk sooner? (512) 702-9685
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <img src={CDN.logo} alt="SoloEdge AI" className="h-10 mx-auto mb-6" />
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Payment confirmed — let's get you scheduled
          </h1>
          {tier && (
            <p className="text-gray-500">
              {tier.name} — {formatAuditPrice(tier)} — {tier.subtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-gray-100 p-7 space-y-5">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              required
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="e.g. Hill Country Roofing"
            />
          </div>

          <div>
            <Label htmlFor="contactName">Your name</Label>
            <Input
              id="contactName"
              required
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(512) 555-0100"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferredTimes">Best days/times for your Audit session</Label>
            <Input
              id="preferredTimes"
              required
              value={form.preferredTimes}
              onChange={(e) => update("preferredTimes", e.target.value)}
              placeholder="e.g. Weekday mornings, or Tue/Thu afternoons"
            />
          </div>

          <div>
            <Label htmlFor="notes">Anything Murphy should know before the session? (optional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="What's the biggest headache right now — missed calls, scheduling, follow-up?"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={submitIntake.isPending}
            className="w-full py-6 text-base font-semibold"
          >
            {submitIntake.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" /> Submitting…
              </>
            ) : (
              "Confirm my Audit request"
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Murphy personally reviews every Audit request and confirms your exact time —
            no automated booking bot.
          </p>
        </form>
      </div>
    </div>
  );
}
