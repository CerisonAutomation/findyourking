/**
 * Stripe Payment Service
 * Production-ready payment processing with subscription support
 *
 * CRITICAL: Server-side only - NEVER expose secret key to client
 * Per Stripe docs: https://stripe.com/docs/api
 *
 * @module StripeService
 */

import Stripe from 'stripe';

// Validate Stripe key exists and is not placeholder
const stripeKey = process.env.STRIPE_SECRET_KEY;
const isValidKey = stripeKey && stripeKey !== 'your-stripe-secret-key' && stripeKey.startsWith('sk_');

if (!isValidKey && typeof window === 'undefined') {
  console.warn('[Stripe] WARNING: No valid Stripe secret key found. Payment features disabled.');
  console.warn('[Stripe] Set STRIPE_SECRET_KEY in .env.local to enable payments.');
  console.warn('[Stripe] Get your key from: https://dashboard.stripe.com/apikeys');
}

// Only initialize Stripe if we have a valid key (server-side only)
const stripe = isValidKey
  ? new Stripe(stripeKey, {
      apiVersion: '2025-11-17.clover',
    })
  : null;

/**
 * Stripe Price IDs by tier (EUR)
 */
export const STRIPE_PRICES = {
  free: process.env.STRIPE_PRICE_FREE || 'price_free',
  bronze: process.env.STRIPE_PRICE_BRONZE || 'price_bronze',
  silver: process.env.STRIPE_PRICE_SILVER || 'price_silver',
  gold: process.env.STRIPE_PRICE_GOLD || 'price_gold',
} as const;

/**
 * Tier prices in EUR cents
 */
export const TIER_PRICES_EUR = {
  free: 0,
  bronze: 499, // €4.99/month
  silver: 999, // €9.99/month
  gold: 1999, // €19.99/month
} as const;

/**
 * Tier features description
 */
export const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 'Free',
    features: ['Browse profiles', 'Limited messaging', 'Ad-supported'],
  },
  bronze: {
    name: 'Bronze',
    price: '€4.99/month',
    features: [
      'See who likes you',
      '5 extra profile views/day',
      'Advanced filters',
    ],
  },
  silver: {
    name: 'Silver',
    price: '€9.99/month',
    popular: true,
    features: [
      'All Bronze features',
      'Unlimited profile views',
      'Incognito mode',
      'Read receipts',
    ],
  },
  gold: {
    name: 'Gold',
    price: '€19.99/month',
    premium: true,
    features: [
      'All Silver features',
      'Profile boost weekly',
      'Priority support',
      'Video chat backgrounds',
    ],
  },
} as const;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    // Try to find existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        userId,
      },
    });

    return customer.id;
  } catch (error) {
    // Monitoring integration point
    throw error;
  }
}

/**
 * Create a Stripe subscription
 */
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  tier: 'free' | 'bronze' | 'silver' | 'gold'
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  if (tier === 'free') {
    throw new Error('Cannot create subscription for free tier');
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      automatic_tax: { enabled: true },
      metadata: {
        tier,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  subscriptionId: string,
  newPriceId: string,
  newTier: 'bronze' | 'silver' | 'gold'
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      metadata: {
        tier: newTier,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Create checkout session for initial purchase
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  tier: 'bronze' | 'silver' | 'gold',
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      automatic_tax: { enabled: true },
      metadata: {
        tier,
      },
    });

    return session.url || '';
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!stripe) {
    console.error('[Stripe] Cannot verify webhook: Stripe not configured');
    return false;
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured');
      return false;
    }

    stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Handle webhook event
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe not configured. Cannot handle webhook events.');
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      console.log('Subscription event:', event.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription deleted:', event.data.object);
      break;
    case 'invoice.payment_succeeded':
      console.log('Invoice paid:', event.data.object);
      break;
    case 'invoice.payment_failed':
      console.log('Invoice failed:', event.data.object);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
}

export default stripe;
