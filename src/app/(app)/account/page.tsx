import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { AccountForm } from './account-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UpdateEmailCard } from './update-email-card';
import { UpdatePasswordCard } from './update-password-card';

export default async function Account() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('userId', user.id)
    .single();

  return (
    <div className="p-4 md:p-6 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        Your Royal Chambers
      </h1>
      <p className="text-muted-foreground">
        Manage your profile, account settings, and preferences.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            This is how other kings will see you in the realm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm user={user} profile={profile} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <UpdateEmailCard email={user.email!} />
        <UpdatePasswordCard />
      </div>
    </div>
  );
}
