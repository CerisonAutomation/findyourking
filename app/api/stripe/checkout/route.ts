import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Stripe } from "stripe";
import { stripeCheckoutSchema } from "@/lib/validation"; // Import the new schema

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = stripeCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.errors.map(e => e.message).join(", ");
    return new Response(message, { status: 400 });
  }

  const { bookingId } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if user is not authenticated
    return redirect("/auth/login");
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, kings(profiles(full_name))")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return new Response("Booking not found", { status: 404 });
  }

  const parsedTotalPrice = parseFloat(booking.total_price);
  if (isNaN(parsedTotalPrice)) {
    return new Response("Invalid booking total price", { status: 400 });
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
  } catch (stripeError: any) {
    console.error('Error creating Stripe checkout session:', stripeError);
    return new Response(stripeError.message || 'Internal Server Error', { status: 500 });
  }
}
