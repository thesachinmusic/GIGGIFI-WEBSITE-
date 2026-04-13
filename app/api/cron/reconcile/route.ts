import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { BookingStatus, EscrowStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notification-service";

export async function POST() {
  const now = new Date();
  const releasedIds: string[] = [];
  const expiredIds: string[] = [];

  const bookings = await prisma.booking.findMany({
    include: {
      artist: true,
      payment: true,
    },
  });

  for (const booking of bookings) {
    const eventDate = booking.eventDate;

    if (booking.status === BookingStatus.PAYMENT_HELD && eventDate < now) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EVENT_COMPLETED },
      });
    }

    if (
      booking.status === BookingStatus.EVENT_COMPLETED &&
      addDays(eventDate, 2) < now &&
      booking.escrowStatus === EscrowStatus.HELD
    ) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.PAYOUT_RELEASED,
          escrowStatus: EscrowStatus.RELEASED,
        },
      });
      await prisma.payment.updateMany({
        where: { bookingId: booking.id },
        data: {
          status: PaymentStatus.PAID,
          releasedAt: now,
        },
      });
      releasedIds.push(booking.id);
    }

    if (booking.status === BookingStatus.ENQUIRY_SENT) {
      const created = booking.createdAt.getTime();
      if (created + 48 * 60 * 60 * 1000 < now.getTime()) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED_BY_ARTIST,
            cancelReason: "Auto-expired after 48 hours without response",
          },
        });
        expiredIds.push(booking.id);
      }
    }
  }

  for (const id of releasedIds) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { artist: true },
    });
    if (booking?.artist.userId) {
      await createNotification({
        userId: booking.artist.userId,
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
