import { NextResponse } from "next/server";
import { createNotification, readDb, updateDb } from "@/lib/server-db";
import { getSessionFromCookies } from "@/lib/session";
import { bookingUpdateSchema } from "@/lib/validations";

interface Context {
  params: { id: string };
}

export async function PATCH(request: Request, context: Context) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const parsed = bookingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const db = await readDb();
  const booking = db.bookings.find((item) => item.id === context.params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const artist = db.artists.find((item) => item.id === booking.artistId);
  const booker = db.bookers.find((item) => item.id === booking.bookerId);

  let nextStatus = booking.status;
  let chatMessage = parsed.data.message;

  switch (parsed.data.action) {
    case "send_quote":
      nextStatus = "QUOTE_RECEIVED";
      break;
    case "accept_quote":
      nextStatus = "AWAITING_PAYMENT";
      break;
    case "artist_accept":
      nextStatus = "EVENT_UPCOMING";
      break;
    case "artist_decline":
      nextStatus = "CANCELLED_BY_ARTIST";
      break;
    case "raise_dispute":
      nextStatus = "DISPUTED";
      break;
    case "mark_completed":
      nextStatus = "EVENT_COMPLETED";
      break;
    case "release_payout":
      nextStatus = "PAYOUT_RELEASED";
      break;
    case "cancel_by_booker":
      nextStatus = "CANCELLED_BY_BOOKER";
      break;
  }

  await updateDb((next) => {
    const target = next.bookings.find((item) => item.id === context.params.id);
    if (!target) return;
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    if (parsed.data.quotedPrice) {
      target.quotedPrice = parsed.data.quotedPrice;
      target.artistPayout = parsed.data.quotedPrice;
      target.platformFee = Math.round(parsed.data.quotedPrice * 0.1);
      target.gstAmount = Math.round((target.platformFee ?? 0) * 0.18);
      target.totalAmount = (target.quotedPrice ?? 0) + (target.platformFee ?? 0) + (target.gstAmount ?? 0);
    }
    if (parsed.data.reason && parsed.data.action === "artist_decline") {
      target.cancelReason = parsed.data.reason;
    }
    if (parsed.data.reason && parsed.data.action === "raise_dispute") {
      target.disputeReason = parsed.data.reason;
    }
    if (parsed.data.message || parsed.data.reason) {
      target.chat.unshift({
        id: `chat-${Date.now()}`,
        from: session.role === "ADMIN" ? "SYSTEM" : session.role,
        body: chatMessage || parsed.data.reason || "Status updated",
        createdAt: new Date().toISOString(),
      });
    }
    if (parsed.data.action === "release_payout") {
      target.escrowStatus = "RELEASED";
      const payment = next.payments.find((item) => item.id === target.paymentId);
      if (payment) {
        payment.status = "PAID";
        payment.releasedAt = new Date().toISOString();
      }
    }
  });

  if (artist?.userId && session.role !== "ARTIST") {
    await createNotification({
      userId: artist.userId,
      title: "Booking updated",
      body: `A booking for ${booking.eventName} is now ${nextStatus.replaceAll("_", " ")}.`,
      type: "BOOKING_UPDATE",
      actionUrl: `/booking/${booking.id}`,
    });
  }

  if (booker && session.role !== "BOOKER") {
    await createNotification({
      userId: booker.userId,
      title: "Booking updated",
      body: `Your booking for ${booking.eventName} is now ${nextStatus.replaceAll("_", " ")}.`,
      type: "BOOKING_UPDATE",
      actionUrl: `/booking/${booking.id}`,
    });
  }

  return NextResponse.json({ success: true, status: nextStatus });
}
