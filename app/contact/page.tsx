import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us | FindYourKing',
  description: 'Get in touch with our support team. We respond within 24-48 hours with comprehensive assistance for all your dating app needs.',
  keywords: 'contact, support, help, customer service, dating app support',
  openGraph: {
    title: 'Contact FindYourKing Support',
    description: 'Professional support team ready to help with your dating app experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact FindYourKing Support',
    description: 'Professional support team ready to help with your dating app experience.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
