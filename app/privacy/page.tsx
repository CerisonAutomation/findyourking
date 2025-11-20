import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, Cookie, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | FindYourKing',
  description:
    'How we protect your privacy and handle your data on FindYourKing dating platform.',
};

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Data Collection',
      content:
        'We collect information you provide directly, including profile data, messages, and preferences. Location data is optional and used only for matching.',
    },
    {
      icon: Lock,
      title: 'Data Security',
      content:
        'Your data is encrypted in transit (TLS 1.3) and at rest. We use Supabase enterprise-grade security with row-level access controls.',
    },
    {
      icon: Eye,
      title: 'Data Usage',
      content:
        'Your information is used solely for providing match suggestions, facilitating connections, and improving our service. We never sell your data.',
    },
    {
      icon: Cookie,
      title: 'Cookies',
      content:
        'We use essential cookies for authentication and session management. Analytics cookies are optional and can be disabled in settings.',
    },
    {
      icon: Shield,
      title: 'Your Rights',
      content:
        'You have the right to access, correct, delete, or export your data at any time. Contact us to exercise these rights.',
    },
    {
      icon: Mail,
      title: 'Contact',
      content:
        'Questions about privacy? Email us at privacy@findyourking.com. We respond within 48 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <Shield className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">Your Privacy Matters</h2>
          <p className="text-gray-300 leading-relaxed">
            At FindYourKing, we take your privacy seriously. This policy
            explains how we collect, use, protect, and share your personal
            information. By using our service, you agree to the terms outlined
            below.
          </p>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{section.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-6">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Account Information
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email address (required for login)</li>
                  <li>Username and display name</li>
                  <li>Profile photo and bio</li>
                  <li>Age, gender, and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Usage Data
                </h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Pages visited and features used</li>
                  <li>Match interactions (likes, messages)</li>
                  <li>Device and browser information</li>
                  <li>IP address and general location (city/country)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              2. How We Use Your Information
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>✓ To provide and improve our matching service</p>
              <p>✓ To facilitate connections between users</p>
              <p>✓ To detect and prevent fraud or abuse</p>
              <p>✓ To send important service updates</p>
              <p>✓ To provide customer support</p>
              <p className="text-purple-400 font-medium mt-4">
                ✗ We NEVER sell your data to third parties
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">3. Data Sharing</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-white">With Other Users:</strong> Your
                public profile (photo, bio, age) is visible to potential
                matches. Messages are private and encrypted.
              </p>
              <p>
                <strong className="text-white">With Service Providers:</strong>{' '}
                We use trusted partners like Supabase (database), Stripe
                (payments), and Stream (messaging). All partners are
                GDPR-compliant.
              </p>
              <p>
                <strong className="text-white">Legal Requirements:</strong> We
                may disclose information if required by law, court order, or to
                protect user safety.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">4. Data Retention</h2>
            <div className="space-y-3 text-gray-300">
              <p>• Active accounts: Data retained indefinitely</p>
              <p>• Deleted accounts: Data permanently removed within 30 days</p>
              <p>• Messages: Retained until either party deletes them</p>
              <p>• Anonymized analytics: Retained for service improvement</p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              5. Your Rights (GDPR/CCPA)
            </h2>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 space-y-3 text-gray-300">
              <p>
                ✓ <strong className="text-white">Right to Access:</strong>{' '}
                Download all your data
              </p>
              <p>
                ✓ <strong className="text-white">Right to Rectify:</strong>{' '}
                Correct inaccurate information
              </p>
              <p>
                ✓ <strong className="text-white">Right to Delete:</strong>{' '}
                Permanently remove your account
              </p>
              <p>
                ✓ <strong className="text-white">Right to Port:</strong> Export
                data in JSON format
              </p>
              <p>
                ✓ <strong className="text-white">Right to Object:</strong> Opt
                out of marketing communications
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">6. Children&apos;s Privacy</h2>
            <p className="text-gray-300">
              FindYourKing is strictly for adults 18+. We do not knowingly
              collect information from minors. If we discover underage users,
              accounts are immediately terminated and data deleted.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              7. International Transfers
            </h2>
            <p className="text-gray-300">
              Your data may be processed in the United States and European
              Union. We use Standard Contractual Clauses (SCCs) and ensure all
              transfers comply with GDPR requirements.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">
              8. Changes to This Policy
            </h2>
            <p className="text-gray-300">
              We may update this policy to reflect service changes or legal
              requirements. Material changes will be notified via email.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">9. Contact Us</h2>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-3">
              <p className="text-gray-300">
                <strong className="text-white">Data Protection Officer:</strong>{' '}
                privacy@findyourking.com
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Response Time:</strong> Within 48
                hours
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Address:</strong> FindYourKing,
                Inc., Privacy Compliance Department
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
          <Link
            href="/terms"
            className="hover:text-purple-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="hover:text-purple-400 transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href="/settings"
            className="hover:text-purple-400 transition-colors"
          >
            Privacy Settings
          </Link>
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
