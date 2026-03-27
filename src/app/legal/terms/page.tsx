import {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | Find Your King',
    description: 'Terms of Service for Find Your King dating platform',
}

export default function TermsOfServicePage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
            <p className="mb-8 text-muted-foreground">Last updated: March 25, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground">
                        By accessing or using Find Your King, you agree to be bound by these Terms of Service.
                        If you disagree with any part of the terms, you may not access the service.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">2. Eligibility</h2>
                    <p className="text-muted-foreground">
                        You must be at least 18 years old to use Find Your King. By using the service, you represent
                        and warrant that you meet this age requirement and have the legal capacity to enter into
                        these terms.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">3. Account Registration</h2>
                    <p className="text-muted-foreground">
                        When you create an account, you must provide accurate, complete, and current information.
                        You are responsible for safeguarding your account credentials and for all activities
                        that occur under your account. Notify us immediately of any unauthorized use.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">4. User Content</h2>
                    <h3 className="mb-2 text-xl font-medium">4.1 Content License</h3>
                    <p className="text-muted-foreground">
                        You retain ownership of content you submit to Find Your King. By submitting content,
                        you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
                        modify, and display your content solely for the purpose of operating and improving
                        the service.
                    </p>

                    <h3 className="mb-2 mt-4 text-xl font-medium">4.2 Prohibited Content</h3>
                    <p className="mb-2 text-muted-foreground">You may not post content that:</p>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>Is illegal, harmful, threatening, abusive, or harassing</li>
                        <li>Contains nudity, sexual content, or violence</li>
                        <li>Impersonates any person or entity</li>
                        <li>Contains malware or malicious code</li>
                        <li>Violates intellectual property rights</li>
                        <li>Promotes discrimination or hate speech</li>
                        <li>Contains false or misleading information</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">5. Prohibited Conduct</h2>
                    <p className="mb-2 text-muted-foreground">You agree not to:</p>
                    <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                        <li>Use the service for any illegal purpose</li>
                        <li>Harass, abuse, or harm another person</li>
                        <li>Create fake profiles or impersonate others</li>
                        <li>Solicit money from other users</li>
                        <li>Use automated scripts or bots</li>
                        <li>Attempt to access accounts without authorization</li>
                        <li>Interfere with the service infrastructure</li>
                        <li>Share other users&apos; personal information</li>
                        <li>Engage in spam or commercial solicitation</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">6. Matching and Communication</h2>
                    <p className="text-muted-foreground">
                        Find Your King uses AI algorithms to suggest potential matches. We do not guarantee
                        the accuracy of matches or the behavior of other users. You are solely responsible
                        for your interactions with other users. We strongly recommend meeting in public
                        places and informing friends of your plans.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">7. Premium Features</h2>
                    <p className="text-muted-foreground">
                        Some features require payment. All purchases are final unless otherwise required by law.
                        Subscription fees are charged according to the billing cycle you select. You may cancel
                        subscriptions at any time, but refunds are not provided for partial billing periods.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">8. Safety and Reporting</h2>
                    <p className="text-muted-foreground">
                        Your safety is important to us. If you encounter suspicious behavior or feel unsafe,
                        immediately cease communication and use our reporting tools. In emergencies, contact
                        local authorities. We investigate reports and may take action including account
                        suspension or termination.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">9. Account Termination</h2>
                    <p className="text-muted-foreground">
                        We reserve the right to suspend or terminate your account at any time for violations
                        of these terms or for any other reason. Upon termination, your right to use the service
                        immediately ceases. You may also delete your account at any time through the settings.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">10. Disclaimer of Warranties</h2>
                    <p className="text-muted-foreground">
                        The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
                        that the service will be uninterrupted, secure, or error-free. Your use of the service
                        is at your sole risk.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">11. Limitation of Liability</h2>
                    <p className="text-muted-foreground">
                        To the maximum extent permitted by law, Find Your King shall not be liable for any
                        indirect, incidental, special, consequential, or punitive damages arising from your
                        use of the service. Our total liability shall not exceed the amount you paid us in
                        the past 12 months.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">12. Changes to Terms</h2>
                    <p className="text-muted-foreground">
                        We may modify these terms at any time. We will notify you of significant changes.
                        Your continued use of the service after changes constitutes acceptance of the new terms.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">13. Governing Law</h2>
                    <p className="text-muted-foreground">
                        These terms shall be governed by the laws of the jurisdiction in which our company
                        is registered, without regard to conflict of law principles.
                    </p>
                </section>

                <section>
                    <h2 className="mb-4 text-2xl font-semibold">14. Contact Information</h2>
                    <p className="text-muted-foreground">
                        For questions about these Terms of Service, contact us at:
                        legal@findyourking.app
                    </p>
                </section>
            </div>
        </div>
    )
}
