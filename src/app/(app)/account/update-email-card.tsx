'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'use-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const updateEmailFormSchema = z.object({
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
});

type UpdateEmailFormValues = z.infer<typeof updateEmailFormSchema>;

export const UpdateEmailCard = ({ email }: { email: string }) => {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<UpdateEmailFormValues>({
    resolver: zodResolver(updateEmailFormSchema),
    defaultValues: { email },
    mode: 'onChange',
  });

  const onSubmit = async (data: UpdateEmailFormValues) => {
    toast.loading('Sending confirmation email...');
    const { error } = await supabase.auth.updateUser(
      { email: data.email },
      { emailRedirectTo: `${location.origin}/auth/callback` }
    );

    if (error) {
      toast.error('Failed to update email', { description: error.message });
    } else {
      toast.success('Confirmation email sent!', {
        description: 'Please check your new email address to confirm the change.',
      });
      router.refresh();
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Your Email</CardTitle>
            <CardDescription>
              Please enter the email address you want to use to log in with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} />
                  </FormControl>
                  <FormDescription>
                    We will email you a confirmation link to verify your new
                    email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
