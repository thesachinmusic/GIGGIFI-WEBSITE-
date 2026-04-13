import { NextResponse } from "next/server";
import { createNotification, makeId, readDb, updateDb } from "@/lib/server-db";
import { getSessionFromCookies } from "@/lib/session";
import { paymentSchema } from "@/lib/validations";

interface Context {
  params: { id: string };
}

export async function POST(request: Request, context: Context) {
  const session = getSessionFromCookies();
  if (!session || session.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker first." }, { status: 401 });
  }

  const parsedBody = paymentSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }

  const db = await readDb();
  const booking = db.bookings.find((item) => item.id === context.params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const booker = db.bookers.find((item) => item.userId === session.userId);
  if (!booker || booking.bookerId !== booker.id) {
    return NextResponse.json({ error: "This booking is not yours." }, { status: 403 });
  }

  const artist = db.artists.find((item) => item.id === booking.artistId);
  if (!artist) {
    return NextResponse.json({ error: "Artist missing." }, { status: 404 });
  }

  const paymentId = makeId("payment");

  await updateDb((next) => {
    const targetBooking = next.bookings.find((item) => item.id === context.params.id);
    if (!targetBooking) return;

    targetBooking.status = "PAYMENT_HELD";
    targetBooking.escrowStatus = "HELD";
    targetBooking.updatedAt = new Date().toISOString();
    targetBooking.paymentId = paymentId;
    targetBooking.contractUrl = `/api/bookings/${targetBooking.id}/contract`;

    next.payments.unshift({
      id: paymentId,
      bookingId: targetBooking.id,
      amount: targetBooking.totalAmount ?? 0,
      platformFee: targetBooking.platformFee ?? 0,
      gstAmount: targetBooking.gstAmount ?? 0,
      artistPayout: targetBooking.artistPayout ?? 0,
      status: "PAID",
      paidAt: new Date().toISOString(),
      razorpayOrderId: `order_${paymentId}`,
      razorpayPaymentId: `pay_${paymentId}`,
      createdAt: new Date().toISOString(),
    });
  });

  if (artist.userId) {
    await createNotification({
      userId: artist.userId,
      title: "Payment held in escrow",
      body: `₹${(booking.totalAmount ?? 0).toLocaleString("en-IN")} is held in escrow for your booking on ${new Date(booking.eventDate).toLocaleDateString("en-IN")}.`,
      type: "PAYMENT_HELD_ARTIST",
      actionUrl: `/booking/${booking.id}`,
    });
  }

  await createNotification({
    userId: session.userId,
    title: "Booking confirmed",
    body: `Your booking with ${artist.stageName} is confirmed. Payment held in escrow.`,
    type: "BOOKING_CONFIRMED",
    actionUrl: `/booking/${booking.id}`,
  });

  return NextResponse.json({
    success: true,
    redirect: `/booking/${booking.id}`,
  });
}
