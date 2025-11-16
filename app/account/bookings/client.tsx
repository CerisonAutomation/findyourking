"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Booking, AuthUser } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface UserBookingsClientProps {
  initialBookings: Booking[];
  user: AuthUser;
}

export function UserBookingsClient({ initialBookings, user }: UserBookingsClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const supabase = createClient();

  const handleReviewSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    bookingId: string,
    kingId: string
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rating = parseInt(formData.get("rating") as string, 10);
    const comment = formData.get("comment") as string;

    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      user_id: user.id,
      king_id: kingId,
      rating,
      comment,
    });

    if (error) {
      console.error("Error submitting review:", error);
    } else {
      console.log("Review submitted successfully");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              King
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Start Time
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              End Time
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Review</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings?.map((booking) => (
            <tr key={booking.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.kings?.profiles?.full_name ||
                  booking.kings?.profiles?.username}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(booking.start_time).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(booking.end_time).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.total_price}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.status}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {booking.status === "completed" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Leave a Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave a Review</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) =>
                          handleReviewSubmit(e, booking.id, booking.king_id)
                        }
                      >
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rating" className="text-right">
                              Rating
                            </Label>
                            <Input
                              id="rating"
                              name="rating"
                              type="number"
                              min="1"
                              max="5"
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="comment" className="text-right">
                              Comment
                            </Label>
                            <Textarea
                              id="comment"
                              name="comment"
                              className="col-span-3"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit">Submit Review</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
