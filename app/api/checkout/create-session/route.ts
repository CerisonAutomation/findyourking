/**
 * Create Checkout Session API
 * Initiates Stripe payment for tier upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/unified-auth';
import { createClient } from '@/lib/supabase/server';
import { STRIPE_PRICES, createOrRetrieveCustomer } from '@/lib/stripe';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json();

    // Validate tier
    if (!['bronze', 'silver', 'gold'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get authenticated user using server-side client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    const customer = await createOrRetrieveCustomer(profile.email, user.id);
    const customerId = customer.id;

    // Create checkout session
    const priceId = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES];

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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        tier,
      },
      // Locale for EU customers
      locale: 'auto',
      // Enable tax collection for EU VAT
      tax_id_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
