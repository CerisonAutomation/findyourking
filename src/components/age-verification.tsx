'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, subYears } from 'date-fns';

interface AgeVerificationProps {
  onVerify: (birthDate: Date) => void;
  onSkip?: () => void;
}

export function AgeVerification({ onVerify, onSkip }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const minimumAge = 18;
  const maxDate = format(subYears(new Date(), minimumAge), 'yyyy-MM-dd');

  const handleDateChange = (value: string) => {
    setBirthDate(value);
    setError('');
    setIsValid(null);

    if (value) {
      const selectedDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();

      // Check if birthday has occurred this year
      const hasBirthdayPassed =
        today.getMonth() > selectedDate.getMonth() ||
        (today.getMonth() === selectedDate.getMonth() && today.getDate() >= selectedDate.getDate());

      const actualAge = hasBirthdayPassed ? age : age - 1;

      if (actualAge < minimumAge) {
        setIsValid(false);
        setError(`You must be at least ${minimumAge} years old to use this service.`);
      } else if (actualAge > 120) {
        setIsValid(false);
        setError('Please enter a valid birth date.');
      } else {
        setIsValid(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!birthDate || !isValid) {
      setError('Please enter a valid birth date.');
      return;
    }

    onVerify(new Date(birthDate));
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Age Verification</h2>
        <p className="text-muted-foreground">
          Please confirm you are 18 years or older
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Age Requirement
          </CardTitle>
          <CardDescription>
            FYKING.MEN is for adults 18+ only. This helps ensure a safe and appropriate environment for all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of Birth</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={maxDate}
                className={isValid === false ? 'border-destructive' : isValid === true ? 'border-green-500' : ''}
                required
              />
              {isValid === true && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Age verified successfully
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={!isValid}
              >
                Verify Age & Continue
              </Button>

              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full text-muted-foreground"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">18+</Badge>
          <Badge variant="secondary">Adult Content</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          By continuing, you confirm you meet the age requirement and agree to our terms.
        </p>
      </div>
    </div>
  );
}