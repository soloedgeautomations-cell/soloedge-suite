import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-10 pb-10 px-8 sm:px-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: May 8, 2026</p>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              SoloEdge Automations ("SoloEdge," "we," "our," or "us") respects your privacy. This
              Privacy Policy explains how we collect, use, disclose, and protect your information
              when you interact with our AI-powered call-handling and messaging services, including
              the Riley AI product, on behalf of contractors and businesses ("Contractors") that use
              our platform.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Contact information:</strong> name, phone number, and any other details
                  you provide when calling a Contractor's business or submitting a service request
                  through our intake forms.
                </li>
                <li>
                  <strong>Service request details:</strong> the nature of the service you are
                  requesting, scheduling preferences, and any context you share with our Riley AI
                  agent.
                </li>
                <li>
                  <strong>Call recordings and transcripts:</strong> when you call a Contractor's
                  business handled by Riley AI, the call may be recorded and transcribed for
                  service fulfillment, quality assurance, and consent verification.
                </li>
                <li>
                  <strong>SMS opt-in records:</strong> timestamped records of your verbal or
                  written consent to receive transactional text messages.
                </li>
                <li>
                  <strong>Technical data:</strong> when you visit our website, we collect basic log
                  data (IP address, browser type, pages visited) for security and analytics.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To deliver the call-handling and messaging service you requested.</li>
                <li>
                  To send transactional SMS confirmations, callback notifications, technician ETAs,
                  appointment reminders, and estimate updates related to your service request.
                </li>
                <li>To connect you with the Contractor whose business you contacted.</li>
                <li>To improve our AI models and service quality.</li>
                <li>To comply with legal obligations and respond to lawful requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Information Sharing</h2>
              <p>
                We do <strong>not</strong> sell your personal information. We do <strong>not</strong>{" "}
                share your information with third parties for their marketing purposes. We share
                information only:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  With the Contractor whose business you contacted, so they can fulfill your
                  service request.
                </li>
                <li>
                  With service providers (such as Twilio for telephony and SMS, and our hosting
                  providers) who process data on our behalf under confidentiality obligations.
                </li>
                <li>When required by law, subpoena, or to protect legal rights and safety.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">SMS Communications</h2>
              <p>
                If you opt in to receive SMS messages, message frequency is transactional and
                varies based on your service request. Message and data rates may apply. You can
                opt out at any time by replying <strong>STOP</strong> to any message. Reply{" "}
                <strong>HELP</strong> for help. We do not share SMS opt-in data or phone numbers
                with third parties or affiliates for marketing purposes. Mobile opt-in data is
                used solely to deliver the service you requested.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Retention</h2>
              <p>
                We retain your information only as long as needed to provide the service, comply
                with legal obligations, and resolve disputes. Call recordings and transcripts are
                retained for quality assurance and consent verification, then deleted on a rolling
                basis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information held by
                us. To exercise these rights, contact us at the email below. We will respond within
                a reasonable timeframe.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Children's Privacy</h2>
              <p>
                Our services are not directed at children under 13. We do not knowingly collect
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The "Last updated" date at
                the top reflects the most recent version. Continued use of our services after
                changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact Us</h2>
              <p>
                Questions about this Privacy Policy? Contact us at{" "}
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
