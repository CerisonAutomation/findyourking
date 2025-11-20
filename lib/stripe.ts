import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

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

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    priceId: process.env.STRIPE_PRICE_FREE!,
    price: 0,
    currency: 'EUR',
    features: ['Browse profiles', 'Limited messaging', 'Ad-supported'],
  },
  BRONZE: {
    name: 'Bronze',
    priceId: process.env.STRIPE_PRICE_BRONZE!,
    price: 4.99,
    currency: 'EUR',
    features: ['See who likes you', '5 extra profile views/day', 'Advanced filters'],
  },
  SILVER: {
    name: 'Silver',
    priceId: process.env.STRIPE_PRICE_SILVER!,
    price: 9.99,
    currency: 'EUR',
    popular: true,
    features: ['All Bronze features', 'Unlimited profile views', 'Incognito mode', 'Read receipts'],
  },
  GOLD: {
    name: 'Gold',
    priceId: process.env.STRIPE_PRICE_GOLD!,
    price: 19.99,
    currency: 'EUR',
    premium: true,
    features: ['All Silver features', 'Profile boost weekly', 'Priority support', 'Video chat backgrounds'],
  },
};

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Create or retrieve Stripe customer
 */
export async function createOrRetrieveCustomer(email: string, userId: string) {
  if (!stripe) throw new Error('Stripe not configured');

  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  return await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });
}
