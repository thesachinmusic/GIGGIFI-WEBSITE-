import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { createNotification, updateDb } from "@/lib/server-db";

export async function POST() {
  const now = new Date();
  const releasedIds: string[] = [];
  const expiredIds: string[] = [];

  const nextDb = await updateDb((db) => {
    for (const booking of db.bookings) {
      const eventDate = new Date(booking.eventDate);

      if (booking.status === "PAYMENT_HELD" && eventDate < now) {
        booking.status = "EVENT_COMPLETED";
        booking.updatedAt = now.toISOString();
      }

      if (
        booking.status === "EVENT_COMPLETED" &&
        addDays(eventDate, 2) < now &&
        booking.escrowStatus === "HELD"
      ) {
        booking.status = "PAYOUT_RELEASED";
        booking.escrowStatus = "RELEASED";
        booking.updatedAt = now.toISOString();
        releasedIds.push(booking.id);

        const payment = db.payments.find((item) => item.id === booking.paymentId);
        if (payment) {
          payment.releasedAt = now.toISOString();
        }
      }

      if (booking.status === "ENQUIRY_SENT") {
        const created = new Date(booking.createdAt).getTime();
        if (created + 48 * 60 * 60 * 1000 < now.getTime()) {
          booking.status = "CANCELLED_BY_ARTIST";
          booking.cancelReason = "Auto-expired after 48 hours without response";
          expiredIds.push(booking.id);
        }
      }
    }

    return db;
  });

  for (const id of releasedIds) {
    const booking = nextDb.bookings.find((item) => item.id === id);
    const artist = nextDb.artists.find((item) => item.id === booking?.artistId);
    if (booking && artist?.userId) {
      await createNotification({
        userId: artist.userId,
        title: "Payout released",
        body: `₹${(booking.artistPayout ?? 0).toLocaleString("en-IN")} transferred to your bank account ending XXXX.`,
        type: "PAYOUT_RELEASED",
        actionUrl: `/booking/${booking.id}`,
      });
    }
  }

  return NextResponse.json({
    success: true,
    released: releasedIds.length,
    expired: expiredIds.length,
  });
}
