import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Stripe } from "stripe";
import { stripeCheckoutSchema } from "@/lib/validation";
import { StripeError } from "@/types/database";

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = stripeCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map(e => e.message).join(", ");
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { bookingId } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if user is not authenticated
    // For API routes, it's better to return an unauthorized response
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, kings(profiles(full_name))")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return new Response(JSON.stringify({ error: "Booking not found" }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const parsedTotalPrice = parseFloat(booking.total_price);
  if (isNaN(parsedTotalPrice)) {
    return new Response(JSON.stringify({ error: "Invalid booking total price" }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Booking with ${booking.kings?.profiles?.full_name}`,
              description: `From ${new Date(booking.start_time).toLocaleString()} to ${new Date(booking.end_time).toLocaleString()}`,
            },
            unit_amount: Math.round(parsedTotalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env['NEXT_PUBLIC_SITE_URL']}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env['NEXT_PUBLIC_SITE_URL']}/kings/${booking.king_id}`,
      metadata: {
        bookingId: booking.id,
      },
    });

    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", booking.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error creating Stripe checkout session:', err.message);
    } else {
      console.error('Unknown error creating Stripe checkout session:', err);
    }
    return new Response(JSON.stringify({ error: 'Payment processing error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
