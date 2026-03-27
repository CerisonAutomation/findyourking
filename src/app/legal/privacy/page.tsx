import {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | Find Your King',
    description: 'Privacy Policy for Find Your King dating platform',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
            <p className="mb-8 text-muted-foreground">Last updated: March 25, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
                    <p className="text-muted-foreground">
                        Welcome to Find Your King. We respect your privacy and are committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                        our dating platform.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>
                    <h3 className="mb-2 text-xl font-medium">2.1 Personal Information</h3>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>Name, email address, and phone number</li>
                        <li>Date of birth and gender</li>
                        <li>Profile photos and bio information</li>
                        <li>Location data (with your consent)</li>
                        <li>Payment information (for premium features)</li>
                    </ul>

                    <h3 className="mb-2 mt-4 text-xl font-medium">2.2 Usage Information</h3>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>App usage statistics and interactions</li>
                        <li>Messages and communication data</li>
                        <li>Match preferences and swiping behavior</li>
                        <li>Device information and IP address</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>To provide and maintain our dating services</li>
                        <li>To match you with other users based on preferences</li>
                        <li>To facilitate communication between matches</li>
                        <li>To process payments for premium features</li>
                        <li>To improve our AI matching algorithms</li>
                        <li>To ensure safety and prevent abuse</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">4. Data Storage and Security</h2>
                    <p className="text-muted-foreground">
                        We implement industry-standard security measures including encryption at rest and in transit,
                        secure authentication, and regular security audits. Your data is stored on secure servers
                        with access restricted to authorized personnel only.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">5. Location Data</h2>
                    <p className="text-muted-foreground">
                        With your consent, we collect precise location data to show you nearby matches. You can control
                        location permissions in your device settings. We use H3 hexagonal indexing to protect your
                        exact location while enabling proximity matching.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">6. AI and Automated Processing</h2>
                    <p className="text-muted-foreground">
                        We use AI for matching recommendations, content moderation, and translation services.
                        These processes are designed to enhance your experience while maintaining privacy.
                        Our AI matching engine analyzes profile compatibility locally where possible.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">7. Your Rights</h2>
                    <p className="mb-2 text-muted-foreground">You have the right to:</p>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Delete your account and data</li>
                        <li>Export your data (data portability)</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Restrict certain data processing</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">8. Data Retention</h2>
                    <p className="text-muted-foreground">
                        We retain your data for as long as your account is active. Upon account deletion, we remove
                        your profile within 30 days, though some anonymized data may be retained for analytics
                        and legal compliance purposes. Messages are retained for 90 days unless deleted by users.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">9. Third-Party Services</h2>
                    <p className="text-muted-foreground">
                        We use select third-party services for hosting, payment processing, and analytics.
                        These providers are bound by data protection agreements and only access data necessary
                        to perform their services.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
                    <p className="text-muted-foreground">
                        For privacy-related questions or to exercise your rights, contact us at:
                        privacy@findyourking.app
                    </p>
                </section>
            </div>
        </div>
    )
}
