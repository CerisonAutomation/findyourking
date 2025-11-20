/**
 * Stripe Webhook Handler
 * Processes subscription events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    const supabase = await createClient();

    // Handle events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as Stripe.Subscription;
        const customerId = subscriptionData.customer as string;
        const tier = (subscriptionData.metadata?.tier as string) || 'bronze';

        // Get customer to find user
        const customer = await stripe.customers.retrieve(customerId);
        
        // Check if customer is not deleted and has metadata
        if ('metadata' in customer && customer.metadata) {
          const userId = customer.metadata.userId as string || '';

          if (userId) {
            // Use type assertion to access period fields (Stripe API version inconsistency)
            const subscription = subscriptionData as any;
            const { error } = await supabase.from('subscriptions').upsert({
              user_id: userId,
              tier,
              status: subscription.status === 'active' ? 'active' : 'cancelled',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items?.data?.[0]?.price?.id,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : new Date().toISOString(),
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
            });

            if (error) console.error('Error updating subscription:', error);

            // Update premium tier in profiles for backward compatibility
            const { error: profileError } = await supabase.from('profiles').update({
              premium_tier: tier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
            }).eq('user_id', userId);

            if (profileError) console.error('Error updating profile tier:', profileError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionData = event.data.object as Stripe.Subscription;
        const customerId = subscriptionData.customer as string;

        const customer = await stripe.customers.retrieve(customerId);

        if ('metadata' in customer && customer.metadata) {
          const userId = (customer.metadata.userId as string) || '';

          if (userId) {
            // Update subscription status to cancelled
            const { error } = await supabase.from('subscriptions').update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            }).eq('stripe_subscription_id', subscriptionData.id);

            if (error) console.error('Error updating subscription:', error);

            // Reset tier to free in profiles for backward compatibility
            const { error: profileError } = await supabase.from('profiles').update({
              premium_tier: 'free',
            }).eq('user_id', userId);

            if (profileError) console.error('Error resetting tier:', profileError);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Payment failed for invoice:', invoice.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}
