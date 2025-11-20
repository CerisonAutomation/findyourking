import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { TierBadge } from '@/components/ui/TierBadge';
import { StorageUsageCard } from '@/components/ui/StorageUsageCard';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getTierData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user's current tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single();

  // Get tier limits
  const { data: tierLimits } = await supabase.rpc('get_user_tier_limits', {
    p_user_id: user.id,
  });

  // Get storage usage
  const { data: storageUsage } = await supabase
    .from('storage_usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return {
    tier: profile?.subscription_tier || 'FREE',
    status: profile?.subscription_status || 'inactive',
    limits: tierLimits?.[0],
    storage: storageUsage || {
      profile_photos_bytes: 0,
      chat_media_bytes: 0,
      private_albums_bytes: 0,
      total_bytes: 0,
    },
  };
}

function TierDataSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

async function TierContent() {
  const data = await getTierData();

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your subscription</p>
        <Link href="/auth/login">
          <Button className="mt-4">Log In</Button>
        </Link>
      </div>
    );
  }

  const { tier, status, limits, storage } = data;

  const tiers = [
    {
      name: 'FREE',
      price: '$0',
      features: ['3 profile photos', '3 MB per file', '50 MB storage', 'Basic features'],
    },
    {
      name: 'BRONZE',
      price: '$9.99/mo',
      features: ['6 profile photos', '5 MB per file', '500 MB storage', '2 AI boyfriends', 'Advanced filters', '2 private albums'],
    },
    {
      name: 'SILVER',
      price: '$19.99/mo',
      features: ['12 profile photos', '10 MB per file', '2 GB storage', '5 AI boyfriends', 'Read receipts', 'Priority support', '5 private albums'],
    },
    {
      name: 'GOLD',
      price: '$29.99/mo',
      features: ['20 profile photos', '20 MB per file', '10 GB storage', 'Unlimited AI boyfriends', 'Video messages', 'All features', '20 private albums'],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            <TierBadge tier={tier as 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD'} size="lg" />
          </CardTitle>
          <CardDescription>
            Status: <span className="capitalize">{status}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {limits && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Profile Photos</p>
                <p className="text-2xl font-bold">{limits.max_profile_photos}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max File Size</p>
                <p className="text-2xl font-bold">{limits.max_file_size_mb} MB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Storage</p>
                <p className="text-2xl font-bold">
                  {limits.max_storage_mb >= 1024 
                    ? `${(limits.max_storage_mb / 1024).toFixed(0)} GB` 
                    : `${limits.max_storage_mb} MB`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Boyfriends</p>
                <p className="text-2xl font-bold">
                  {limits.ai_boyfriends_enabled 
                    ? (limits.ai_boyfriends_max === 999 ? '∞' : limits.ai_boyfriends_max)
                    : '0'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StorageUsageCard
        profilePhotosBytes={storage.profile_photos_bytes}
        chatMediaBytes={storage.chat_media_bytes}
        privateAlbumsBytes={storage.private_albums_bytes}
        totalBytes={storage.total_bytes}
        maxStorageMB={limits?.max_storage_mb || 50}
      />

      {tier === 'FREE' && (
        <UpgradePrompt
          title="Unlock Premium Features"
          description="Upgrade to access AI boyfriends, more photos, and exclusive features"
          feature="Premium features"
        />
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((planTier) => (
            <Card 
              key={planTier.name} 
              className={tier === planTier.name ? 'border-2 border-primary' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {planTier.name === 'GOLD' && <Crown className="w-5 h-5 text-yellow-500" />}
                  {planTier.name}
                </CardTitle>
                <CardDescription className="text-2xl font-bold">{planTier.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {planTier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {tier !== planTier.name && (
                  <Link href={`/pricing?tier=${planTier.name}`}>
                    <Button className="w-full mt-4" variant={planTier.name === 'GOLD' ? 'default' : 'outline'}>
                      {tier === 'FREE' || planTier.name === 'FREE' ? 'Select Plan' : 'Upgrade'}
                    </Button>
                  </Link>
                )}
                {tier === planTier.name && (
                  <Button className="w-full mt-4" disabled>
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription & Storage</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription tier and monitor your storage usage
        </p>
      </div>
      
      <Suspense fallback={<TierDataSkeleton />}>
        <TierContent />
      </Suspense>
    </div>
  );
}
