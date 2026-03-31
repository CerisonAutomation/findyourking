import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileView } from '@/components/profile/profile-view';
import { AppLayout } from '@/components/app-layout';
import type { Metadata } from 'next';

interface Props { params: Promise<{ userId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const supabase   = await createServerClient();
  const { data }   = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url')
    .eq('user_id', userId)
    .single();
  if (!data) return { title: 'Profile not found' };
  return {
    title:       data.display_name ?? 'King',
    description: data.bio ?? 'Find Your King profile.',
    openGraph: {
      images: data.avatar_url ? [{ url: data.avatar_url }] : [],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const supabase   = await createServerClient();
  const { data }   = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) notFound();

  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading profile…</span>
        </div>
      }>
        <ProfileView initialProfile={data} userId={userId} />
      </Suspense>
    </AppLayout>
  );
}
