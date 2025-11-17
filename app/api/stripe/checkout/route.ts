import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import { Stripe } from 'stripe';
import { stripeCheckoutSchema } from '@/lib/validation';
import {
  createErrorResponse,
  logApiError,
  getRequestId,
  safeParseJson,
  categorizeError,
  ErrorCategory,
} from '@/lib/api-error-handler';
import {
  authenticateRequest,
  getClientIp,
  getSecurityHeaders,
} from '@/lib/api-security';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2024-12-18.acacia' as any,
});

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for a booking
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const clientIp = getClientIp(req);

  try {
    // Authenticate request
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return createErrorResponse(
        new Error('Unauthorized'),
        requestId,
        401,
        'Authentication required',
      );
    }

    // Parse request body
    const parseResult = await safeParseJson<{ bookingId: string }>(req);
    if (!parseResult.success) {
      logApiError(
        'stripe-checkout',
        new Error(parseResult.error || 'Invalid JSON'),
        requestId,
      );
      return createErrorResponse(
        new Error(parseResult.error),
        requestId,
        400,
        'Invalid request format',
      );
    }

    // Validate against schema
    const parsed = stripeCheckoutSchema.safeParse(parseResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues.map((e) => e.message).join(', ');
      logApiError('stripe-checkout', new Error(message), requestId, {
        validationErrors: parsed.error.issues,
      });
      return createErrorResponse(
        new Error(message),
        requestId,
        400,
        'Validation error',
      );
    }

    const { bookingId } = parsed.data;
    const supabase = await createClient();

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, kings(profiles(full_name))')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logApiError(
        'stripe-checkout',
        new Error('Booking not found'),
        requestId,
        { bookingId },
      );
      return createErrorResponse(
        new Error('Booking not found'),
        requestId,
        404,
        'The requested booking does not exist',
      );
    }

    // Validate booking total price
    const parsedTotalPrice = parseFloat(booking.total_price);
    if (isNaN(parsedTotalPrice) || parsedTotalPrice <= 0) {
      logApiError('stripe-checkout', new Error('Invalid price'), requestId, {
        bookingId,
        totalPrice: booking.total_price,
      });
      return createErrorResponse(
        new Error('Invalid booking price'),
        requestId,
        400,
        'Booking price is invalid',
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booking with ${
                booking.kings?.profiles?.full_name || 'Companion'
              }`,
              description: `From ${new Date(
                booking.start_time,
              ).toLocaleString()} to ${new Date(
                booking.end_time,
              ).toLocaleString()}`,
            },
            unit_amount: Math.round(parsedTotalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env['NEXT_PUBLIC_SITE_URL']}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env['NEXT_PUBLIC_SITE_URL']}/kings/${booking.king_id}`,
      metadata: {
        bookingId: booking.id,
        userId: auth.userId,
      },
    });

    // Store payment intent in database
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq('id', booking.id);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        context: 'stripe-checkout',
        status: 'success',
        bookingId,
        sessionId: session.id,
        requestId,
        clientIp,
      }),
    );

    return Response.json(
      { url: session.url },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders(),
        },
      },
    );
  } catch (err: unknown) {
    logApiError('stripe-checkout', err, requestId, { clientIp });
    return createErrorResponse(
      err instanceof Error ? err : new Error('Unknown error'),
      requestId,
      500,
      'Payment processing error. Please try again.',
    );
  }
}
