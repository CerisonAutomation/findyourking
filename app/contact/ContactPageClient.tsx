'use client';

import { useState, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, MessageCircle, Clock, Send, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { contactFormSchema, type ContactFormData } from '@/lib/schemas/contact';
import { submitContactForm } from '@/lib/actions/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';

interface Attachment {
  file: File;
  preview?: string;
  id: string;
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  messageId: string | null;
  attachments: Attachment[];
}

export default function ContactPageClient() {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    messageId: null,
    attachments: [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange',
    defaultValues: {
      category: 'general',
      priority: 'normal',
    },
  });

  const category = watch('category');
  const priority = watch('priority');

  // Handle file attachments
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed.`);
        return false;
      }
      return true;
    });

    const newAttachments: Attachment[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFormState(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments].slice(0, 3), // Max 3 files
    }));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setFormState(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => {
        if (att.id === id && att.preview) {
          URL.revokeObjectURL(att.preview);
        }
        return att.id !== id;
      }),
    }));
  }, []);

  // Form submission
  const onSubmit = useCallback(async (data: ContactFormData) => {
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Convert attachments to the format expected by the server action
      const attachments = formState.attachments.map(att => ({
        name: att.file.name,
        type: att.file.type,
        size: att.file.size,
        data: '', // Will be handled on client side
      }));

      const result = await submitContactForm({
        ...data,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.success) {
        setFormState(prev => ({
          ...prev,
          isSuccess: true,
          messageId: result.messageId || null,
          isSubmitting: false,
        }));
        reset();
        // Clear attachments
        formState.attachments.forEach(att => {
          if (att.preview) URL.revokeObjectURL(att.preview);
        });
        setFormState(prev => ({ ...prev, attachments: [] }));
      } else {
        setFormState(prev => ({
          ...prev,
          error: result.error || 'Failed to send message',
          isSubmitting: false,
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: 'An unexpected error occurred. Please try again.',
        isSubmitting: false,
      }));
    }
  }, [formState.attachments, reset]);

  // Reset form for new submission
  const handleNewSubmission = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      isSuccess: false,
      error: null,
      messageId: null,
    }));
    reset();
  }, [reset]);

  if (formState.isSuccess) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
          <div className="container mx-auto px-6 py-16 max-w-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-4xl font-black mb-4">Message Sent Successfully! 🎉</h1>
              <p className="text-gray-400 text-lg mb-8">
                Thank you for contacting us. We've received your message and will respond within 24-48 hours.
              </p>

              {formState.messageId && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-400">
                    Message ID: <code className="text-purple-400">{formState.messageId}</code>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Button onClick={handleNewSubmission} variant="outline" className="mr-4">
                  Send Another Message
                </Button>
                <Link href="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
        <div className="container mx-auto px-6 py-16 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
              <MessageCircle className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-200">
              Contact Us
            </h1>
            <p className="text-gray-400 text-lg">
              Get in touch with our support team. We respond within 24-48 hours.
            </p>
          </div>

          {/* Error Alert */}
          {formState.error && (
            <Alert className="mb-6 border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {formState.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send Us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you soon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name and Email */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name *</label>
                        <Input
                          {...register('name')}
                          placeholder="Your full name"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          disabled={formState.isSubmitting}
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <Input
                          {...register('email')}
                          type="email"
                          placeholder="your@email.com"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          disabled={formState.isSubmitting}
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Category and Priority */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <Select
                          value={category}
                          onValueChange={(value) => setValue('category', value as any)}
                          disabled={formState.isSubmitting}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="legal">Legal & Privacy</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <Select
                          value={priority}
                          onValueChange={(value) => setValue('priority', value as any)}
                          disabled={formState.isSubmitting}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <Badge variant="secondary">🟢 Low</Badge>
                            </SelectItem>
                            <SelectItem value="normal">
                              <Badge variant="secondary">🟡 Normal</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                              <Badge variant="outline">🟠 High</Badge>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <Badge variant="destructive">🔴 Urgent</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject *</label>
                      <Input
                        {...register('subject')}
                        placeholder="Brief description of your inquiry"
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        disabled={formState.isSubmitting}
                      />
                      {errors.subject && (
                        <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Message *</label>
                      <Textarea
                        {...register('message')}
                        rows={6}
                        placeholder="Tell us how we can help you..."
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                        disabled={formState.isSubmitting}
                      />
                      {errors.message && (
                        <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    {/* File Attachments */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.txt"
                          onChange={handleFileSelect}
                          className="bg-white/10 border-white/20 text-white file:bg-purple-600 file:text-white file:border-none file:rounded-md file:px-3 file:py-1 file:mr-3 file:hover:bg-purple-700"
                          disabled={formState.isSubmitting || formState.attachments.length >= 3}
                        />
                        <p className="text-xs text-gray-400">
                          Max 3 files, 5MB each. Supported: Images, PDF, TXT
                        </p>
                      </div>

                      {/* Attachment Previews */}
                      {formState.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formState.attachments.map((att) => (
                            <div key={att.id} className="relative group">
                              {att.preview ? (
                                <img
                                  src={att.preview}
                                  alt={att.file.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-white/20"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                                  <Upload className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeAttachment(att.id)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={formState.isSubmitting}
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                              <p className="text-xs text-gray-400 mt-1 truncate w-16">
                                {att.file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Honeypot field (hidden) */}
                    <input
                      type="text"
                      {...register('website')}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={formState.isSubmitting || !isValid}
                      className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                    >
                      {formState.isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Methods */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Email Support</p>
                      <p className="text-sm text-gray-400">support@findyourking.com</p>
                      <p className="text-xs text-gray-500">Response within 48 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Response Time</p>
                      <p className="text-sm text-gray-400">24-48 hours for normal priority</p>
                      <p className="text-xs text-gray-500">12 hours for urgent issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-300 mb-4">Looking for quick answers?</p>
                    <Link href="/help">
                      <Button variant="outline" className="w-full">
                        Visit Help Center
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
            <Link href="/about" className="hover:text-purple-400 transition-colors">
              About Us
            </Link>
            <Link href="/privacy" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-purple-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}