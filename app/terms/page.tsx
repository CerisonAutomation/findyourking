import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Shield,
  CreditCard,
  Ban,
  UserCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | FindYourKing',
  description:
    'Terms and conditions for using the FindYourKing dating platform.',
};

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <FileText className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-lg">Last updated: {lastUpdated}</p>
        </div>

        {/* Quick Rules */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <UserCheck className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="font-bold mb-2">18+ Only</h3>
            <p className="text-sm text-gray-400">Adults only platform</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold mb-2">Be Respectful</h3>
            <p className="text-sm text-gray-400">Harassment not tolerated</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <Ban className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold mb-2">No Spam</h3>
            <p className="text-sm text-gray-400">Genuine connections only</p>
          </div>
        </div>

        {/* Full Terms */}
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-6">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using FindYourKing (&quot;Service&quot;), you agree to be
              bound by these Terms of Service (&quot;Terms&quot;). If you disagree with
              any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">2. Eligibility</h2>
            <div className="space-y-3 text-gray-300">
              <p>• You must be at least 18 years old to use this Service</p>
              <p>
                • You must not be prohibited from using the Service under
                applicable laws
              </p>
              <p>• You must not have been previously banned from the Service</p>
              <p>• You must provide accurate and truthful information</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                <p className="text-sm text-red-200">
                  <strong>Warning:</strong> Using the Service while under 18
                  years old will result in immediate account termination and may
                  be reported to authorities.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              3. Account Responsibilities
            </h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  You Must:
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Maintain the confidentiality of your account credentials
                  </li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activity under your account</li>
                  <li>Provide accurate profile information</li>
                  <li>Use your own photos (not stolen or fake images)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  You Must Not:
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create multiple accounts</li>
                  <li>Impersonate others</li>
                  <li>Share your account with others</li>
                  <li>Use automated bots or scripts</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">4. Prohibited Conduct</h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <p className="text-red-400 font-semibold mb-4">
                The following behaviors will result in immediate account
                suspension:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>❌ Harassment, bullying, or hate speech</li>
                <li>❌ Soliciting money or financial information</li>
                <li>❌ Spam, scams, or fraudulent activity</li>
                <li>❌ Sharing explicit content without consent</li>
                <li>❌ Promoting illegal activities</li>
                <li>❌ Attempting to hack or exploit the Service</li>
                <li>
                  ❌ Discriminatory behavior based on race, religion, gender, or
                  sexual orientation
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              5. Subscription & Payments
            </h2>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    Premium Subscriptions
                  </h3>
                  <p>
                    Premium tiers are billed monthly via Stripe. Subscriptions
                    auto-renew unless cancelled 24 hours before the renewal
                    date. Refunds are not provided for partial months.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Cancellation
                </h3>
                <p>
                  You may cancel your subscription at any time from Settings →
                  Billing. Access continues until the end of the current billing
                  period.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              6. Content Ownership & License
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-white">Your Content:</strong> You retain
                ownership of all content you upload (photos, messages, profile).
                By posting, you grant us a worldwide license to use, display,
                and distribute your content solely for operating the Service.
              </p>
              <p>
                <strong className="text-white">Our Content:</strong> The Service
                design, code, and branding are owned by FindYourKing and
                protected by copyright and trademark laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              7. Disclaimer of Warranties
            </h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-gray-300">
              <p className="font-semibold text-yellow-200 mb-3">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p>
                We do not guarantee that the Service will be uninterrupted,
                secure, or error-free. We do not verify the identity,
                background, or intentions of users. Use the Service at your own
                risk.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-300 leading-relaxed">
              FindYourKing shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the
              Service. Our total liability shall not exceed the amount you paid
              for premium services in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">9. Dispute Resolution</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-white">Informal Resolution:</strong>{' '}
                Contact support@findyourking.com to resolve disputes informally
                first.
              </p>
              <p>
                <strong className="text-white">Arbitration:</strong> If informal
                resolution fails, disputes will be resolved through binding
                arbitration, not court litigation.
              </p>
              <p>
                <strong className="text-white">Governing Law:</strong> These
                Terms are governed by the laws of [Your Jurisdiction].
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">10. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these Terms at any time. Material
              changes will be notified via email 30 days in advance. Continued
              use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">11. Termination</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-white">By You:</strong> You may delete
                your account at any time from Settings → Delete Account.
              </p>
              <p>
                <strong className="text-white">By Us:</strong> We may suspend or
                terminate accounts that violate these Terms, without refund.
              </p>
              <p>
                <strong className="text-white">Effect:</strong> Upon
                termination, your account and data will be permanently deleted
                within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">12. Contact Information</h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
              <p className="text-gray-300">
                <strong className="text-white">Email:</strong>{' '}
                legal@findyourking.com
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Support:</strong>{' '}
                support@findyourking.com
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Response Time:</strong> Within 48
                hours
              </p>
            </div>
          </section>
        </div>

        {/* Acknowledgement */}
        <div className="mt-16 bg-purple-500/10 border border-purple-500/30 rounded-xl p-8 text-center">
          <p className="text-gray-300 mb-4">
            By using FindYourKing, you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="text-sm text-gray-400">Effective Date: {lastUpdated}</p>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
          <Link
            href="/privacy"
            className="hover:text-purple-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="hover:text-purple-400 transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href="/help"
            className="hover:text-purple-400 transition-colors"
          >
            Help Center
          </Link>
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
