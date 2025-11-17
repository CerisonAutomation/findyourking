import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>Your booking request has been successfully submitted.</p>
            <p>You will receive a confirmation once the king accepts your request.</p>
            <Link href="/kings">
              <Button className="w-full">Browse More kings</Button>
            </Link>
            <Link href="/account/profile">
              <Button variant="outline" className="w-full mt-2">View Your Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
