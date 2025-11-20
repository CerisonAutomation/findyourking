import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  feature: string;
  requiredTier?: string;
}

export function UpgradePrompt({
  title = 'Upgrade to Premium',
  description,
  feature,
  requiredTier = 'BRONZE',
}: UpgradePromptProps) {
  return (
    <Card className="border-2 border-yellow-200 bg-linear-to-br from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          {title}
        </CardTitle>
        <CardDescription>
          {description || `${feature} requires ${requiredTier} tier or higher`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/pricing">
          <Button className="w-full bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
