import { redirect } from 'next/navigation';

/**
 * /bookings is now /events.
 * Permanent redirect for any bookmarked or linked URLs.
 */
export default function BookingsRedirectPage() {
  redirect('/events');
}
