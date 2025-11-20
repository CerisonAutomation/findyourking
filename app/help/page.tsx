import type { Metadata } from 'next';
import Link from 'next/link';
import {
  HelpCircle,
  MessageCircle,
  Heart,
  Shield,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center | FindYourKing',
  description:
    'Frequently asked questions and help documentation for FindYourKing.',
};

export default function HelpPage() {
  const faqs = [
    {
      category: 'Getting Started',
      icon: Zap,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click Sign Up and choose your email/password or use magic link. After signing up, select your role (Seeker or Provider) and complete your profile.',
        },
        {
          q: 'What is the difference between Seeker and Provider roles?',
          a: 'Seekers browse profiles and book appointments. Providers offer services and manage their availability. You can change your role once per 24 hours in Settings.',
        },
        {
          q: 'Is FindYourKing free to use?',
          a: 'Yes! We offer a free tier with basic features. Premium tiers (Bronze, Silver, Gold, King) unlock advanced features like unlimited likes, profile boosts, and AI boyfriend access.',
        },
      ],
    },
    {
      category: 'Account and Privacy',
      icon: Shield,
      questions: [
        {
          q: 'How do I verify my profile?',
          a: 'Complete your profile with a clear photo and bio. Admin verification is automatic for most users. Providers may require additional ID verification.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Go to Settings → Delete Account. All your data will be permanently deleted within 30 days as per GDPR requirements.',
        },
        {
          q: 'How secure is my data?',
          a: 'We use bank-level encryption (TLS 1.3), Row Level Security, and follow GDPR/CCPA compliance. Your data is never sold to third parties.',
        },
      ],
    },
    {
      category: 'Matches and Messaging',
      icon: Heart,
      questions: [
        {
          q: 'How does matching work?',
          a: 'When you like someone and they like you back, it is a match! You will get a notification and can start chatting immediately via our real-time messaging system.',
        },
        {
          q: 'Can I unmatch someone?',
          a: 'Yes. Go to your matches, click the match, and select Unmatch. They will not be notified, but the conversation will be deleted.',
        },
        {
          q: 'What if someone is harassing me?',
          a: 'Block and report them immediately. We have zero tolerance for harassment. Violators are permanently banned.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <HelpCircle className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
            Help Center
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Find answers to common questions
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold">{section.category}</h2>
                </div>

                <div className="space-y-6">
                  {section.questions.map((faq, qIdx) => (
                    <div
                      key={qIdx}
                      className="border-l-2 border-purple-500/50 pl-4"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-white">
                        {faq.q}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-white/90 mb-6">
            Our support team is here to assist you
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Support
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
          <Link
            href="/about"
            className="hover:text-purple-400 transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/privacy"
            className="hover:text-purple-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-purple-400 transition-colors"
          >
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
