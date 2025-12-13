'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Scale, AlertTriangle } from 'lucide-react';

interface LegalComplianceProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function LegalCompliance({ onAccept, onDecline }: LegalComplianceProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedAge, setAcceptedAge] = useState(false);
  const [acceptedConduct, setAcceptedConduct] = useState(false);

  const allAccepted = acceptedTerms && acceptedPrivacy && acceptedAge && acceptedConduct;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Legal Compliance</h2>
        <p className="text-muted-foreground">
          Before you continue, please review and accept our terms
        </p>
      </div>

      <div className="space-y-4">
        {/* Age Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Age Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="age-verification"
                checked={acceptedAge}
                onCheckedChange={setAcceptedAge}
                className="mt-1"
              />
              <div className="space-y-1">
                <label
                  htmlFor="age-verification"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that I am 18 years of age or older
                </label>
                <p className="text-xs text-muted-foreground">
                  FYKING.MEN is intended for adults 18+ only. By continuing, you certify you meet this requirement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms of Service */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ScrollArea className="h-32 w-full rounded-md border p-4">
                <div className="text-sm space-y-3">
                  <p>
                    <strong>1. Acceptance of Terms</strong><br />
                    By accessing and using FYKING.MEN, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                  <p>
                    <strong>2. User Responsibilities</strong><br />
                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                  </p>
                  <p>
                    <strong>3. Prohibited Activities</strong><br />
                    You may not use the service for any unlawful purpose or to solicit others to perform unlawful acts.
                  </p>
                  <p>
                    <strong>4. Content Policy</strong><br />
                    All content must be appropriate and respectful. Harassment, discrimination, or inappropriate content will result in account suspension.
                  </p>
                  <p>
                    <strong>5. Privacy</strong><br />
                    Your privacy is important to us. Please review our Privacy Policy for details on how we collect and use your information.
                  </p>
                </div>
              </ScrollArea>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-acceptance"
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="terms-acceptance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and agree to the Terms of Service
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-500" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ScrollArea className="h-32 w-full rounded-md border p-4">
                <div className="text-sm space-y-3">
                  <p>
                    <strong>Information We Collect</strong><br />
                    We collect information you provide directly, such as when you create an account, use our services, or contact us.
                  </p>
                  <p>
                    <strong>How We Use Information</strong><br />
                    We use the information to provide, maintain, and improve our services, process transactions, and communicate with you.
                  </p>
                  <p>
                    <strong>Information Sharing</strong><br />
                    We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                  </p>
                  <p>
                    <strong>Data Security</strong><br />
                    We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  <p>
                    <strong>Your Rights</strong><br />
                    You have the right to access, update, or delete your personal information. Contact us to exercise these rights.
                  </p>
                </div>
              </ScrollArea>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy-acceptance"
                  checked={acceptedPrivacy}
                  onCheckedChange={setAcceptedPrivacy}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="privacy-acceptance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and agree to the Privacy Policy
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code of Conduct */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-purple-500" />
              Code of Conduct
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ScrollArea className="h-32 w-full rounded-md border p-4">
                <div className="text-sm space-y-3">
                  <p>
                    <strong>Respect and Dignity</strong><br />
                    Treat all users with respect. Discrimination, harassment, or inappropriate behavior will not be tolerated.
                  </p>
                  <p>
                    <strong>Consent and Communication</strong><br />
                    Always obtain clear consent and communicate openly. Respect boundaries and personal preferences.
                  </p>
                  <p>
                    <strong>Safety First</strong><br />
                    Prioritize your safety and the safety of others. Report any concerning behavior immediately.
                  </p>
                  <p>
                    <strong>Legal Compliance</strong><br />
                    All activities must comply with local laws and regulations. FYKING.MEN reserves the right to report illegal activities.
                  </p>
                  <p>
                    <strong>Platform Integrity</strong><br />
                    Maintain the integrity of our platform. Do not engage in spam, fake profiles, or manipulative behavior.
                  </p>
                </div>
              </ScrollArea>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="conduct-acceptance"
                  checked={acceptedConduct}
                  onCheckedChange={setAcceptedConduct}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="conduct-acceptance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to follow the Code of Conduct
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onDecline}
          className="flex-1"
        >
          Decline
        </Button>
        <Button
          onClick={onAccept}
          disabled={!allAccepted}
          className="flex-1"
        >
          Accept & Continue
        </Button>
      </div>

      {!allAccepted && (
        <p className="text-xs text-muted-foreground text-center">
          Please accept all terms to continue
        </p>
      )}
    </div>
  );
}