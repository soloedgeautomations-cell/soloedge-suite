import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-10 pb-10 px-8 sm:px-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: May 8, 2026</p>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">SoloEdge SMS Service</h2>
              <p>
                These Terms and Conditions govern your participation in the SoloEdge Automations
                ("SoloEdge") SMS messaging program ("Service"). By opting in to receive text
                messages from SoloEdge or any of our Contractor partners through our Riley AI
                platform, you agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Program Description</h2>
              <p>
                SoloEdge sends transactional SMS messages on behalf of trades contractors and
                service businesses ("Contractors") that use our Riley AI call-handling platform.
                Messages may include: confirmation of your service request, callback notifications,
                technician arrival ETAs, appointment reminders, and estimate updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Message Frequency</h2>
              <p>
                Message frequency varies based on your service request and your interactions with
                the Contractor. Typical service requests result in 1 to 5 SMS messages. We do not
                send promotional or marketing messages under this program.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Message and Data Rates</h2>
              <p>
                <strong>Message and data rates may apply.</strong> Standard SMS and data charges
                from your wireless carrier may apply to each message you send and receive. Contact
                your carrier for details about your messaging plan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">How to Opt Out</h2>
              <p>
                You can stop receiving messages from us at any time. Reply{" "}
                <strong className="text-lg">STOP</strong> to any message you receive. After you
                send STOP, we will send a confirmation message and you will not receive further
                messages under this program. If you wish to opt back in, reply{" "}
                <strong>JOIN</strong>, <strong>START</strong>, or <strong>SUBSCRIBE</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">How to Get Help</h2>
              <p>
                Reply <strong className="text-lg">HELP</strong> to any message to receive
                information about the program and contact information. You can also email us
                directly at{" "}
                <a
                  href="mailto:soloedgeautomations@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  soloedgeautomations@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Carrier Liability</h2>
              <p>
                Carriers are not liable for delayed or undelivered messages. SoloEdge is not
                responsible for any delays or failures in message delivery caused by your wireless
                carrier or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Eligibility</h2>
              <p>
                You must be at least 18 years old, or have the consent of a parent or legal
                guardian, to use this Service. The Service is intended for use within the United
                States.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Privacy</h2>
              <p>
                Your use of the Service is also governed by our{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                , which describes what data we collect and how we use it. We do not sell your
                phone number or share it with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. The "Last updated" date at the top
                reflects the most recent version. Material changes will be communicated through
                our Service or website. Continued use after changes constitutes acceptance of the
                updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of Texas, without regard to its
                conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact</h2>
              <p>
                Questions about these Terms? Email us at{" "}
                <a
                  href="mailto:soloedgeautomations@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  soloedgeautomations@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
