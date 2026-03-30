'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
    .string({ required_error: 'Please enter an email address.' })
    .email({ message: 'Please enter a valid email address.' }),
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
    const toastId = toast.loading('Sending confirmation email...');
    try {
      const { error } = await supabase.auth.updateUser(
        { email: data.email },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      );

      if (error) {
        toast.error('Failed to update email', {
          id: toastId,
          description: error.message,
        });
        return;
      }

      toast.success('Confirmation email sent!', {
        id: toastId,
        description: 'Check your new inbox to confirm the change.',
      });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error('Something went wrong', { id: toastId, description: message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Your Email</CardTitle>
            <CardDescription>
              Update the email address you use to log in to your kingdom.
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
                    <Input
                      type="email"
                      placeholder="king@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A confirmation link will be sent to your new email address.
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
