import "server-only";

import {
  BookingStatus,
  ChatActor,
  EscrowStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import type { z } from "zod";
import { calculatePricing } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notification-service";
import {
  bookingUpdateSchema,
  enquirySchema,
  paymentSchema,
} from "@/lib/validations";

type EnquiryInput = z.infer<typeof enquirySchema>;
type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
type PaymentInput = z.infer<typeof paymentSchema>;

function asArtistPackages(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is { title: string; price: number } =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as { title?: unknown }).title === "string" &&
              typeof (item as { price?: unknown }).price === "number",
          ),
      )
    : [];
}

async function getViewerContext(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      artistProfile: true,
      bookerProfile: true,
    },
  });
}

export async function createBookingForBooker(userId: string, payload: EnquiryInput) {
  const viewer = await getViewerContext(userId);

  if (!viewer?.bookerProfile || viewer.role !== Role.BOOKER) {
    throw new Error("Login as a booker to proceed.");
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { id: payload.artistId },
  });

  if (!artist) {
    throw new Error("Artist not found.");
  }

  const blocked = artist.blackoutDates.some(
    (date) => date.toDateString() === new Date(payload.eventDate).toDateString(),
  );

  if (blocked) {
    throw new Error("Date unavailable. Please submit an enquiry for alternate dates instead.");
  }

  const packages = asArtistPackages(artist.packages);
  const quoteSource =
    payload.quotedPrice ??
    packages.find((pkg) => pkg.title === payload.quickBookPackage)?.price ??
    artist.basePriceSolo;
  const pricing = calculatePricing(quoteSource);

  const booking = await prisma.booking.create({
    data: {
      bookerId: viewer.bookerProfile.id,
      artistId: artist.id,
      bookingType: payload.mode,
      status:
        payload.mode === "QUICK_BOOKING"
          ? BookingStatus.AWAITING_PAYMENT
          : BookingStatus.ENQUIRY_SENT,
      eventName: payload.eventName,
      eventType: payload.eventType,
      eventDate: new Date(payload.eventDate),
      isFlexibleDate: payload.isFlexibleDate,
      alternateDates: payload.alternateDates.map((value) => new Date(value)),
      eventStartTime: payload.eventStartTime,
      eventEndTime: payload.eventEndTime,
      venueType: payload.venueType,
      venueName: payload.venueName,
      venueAddress: payload.venueAddress,
      eventCity: payload.eventCity,
      eventState: payload.eventState,
      audienceSize: payload.audienceSize,
      duration: payload.duration,
      performanceType: payload.performanceType,
      languagePref: payload.languagePref,
      specialRequests: payload.specialRequests,
      soundAvailable: payload.soundAvailable,
      lightAvailable: payload.lightAvailable,
      travelArranged: payload.travelArranged,
      accomProvided: payload.accomProvided,
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      contactPerson: payload.contactPerson,
      contactPhone: payload.contactPhone,
      responseUrgency: payload.responseUrgency,
      moodboardUrl: payload.moodboardUrl,
      quotedPrice: pricing.artistFee,
      totalAmount: pricing.total,
      platformFee: pricing.platformFee,
      gstAmount: pricing.gstAmount,
      artistPayout: pricing.artistPayout,
      quickBookPackage: payload.quickBookPackage,
      messages: {
        create: {
          actor: ChatActor.BOOKER,
          body:
            payload.mode === "QUICK_BOOKING"
              ? "Quick booking request submitted."
              : "Enquiry sent.",
        },
      },
    },
  });

  if (artist.userId) {
    await createNotification({
      userId: artist.userId,
      title: "New enquiry received",
      body: `New enquiry for ${payload.eventType} on ${new Date(payload.eventDate).toLocaleDateString("en-IN")}.`,
      type: "ENQUIRY_RECEIVED",
      actionUrl: "/artist/enquiries",
    });
  }

  return booking;
}

export async function getAuthorizedBooking(bookingId: string, userId: string) {
  const [viewer, booking] = await Promise.all([
    getViewerContext(userId),
    prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        artist: true,
        booker: true,
        messages: { orderBy: { createdAt: "desc" } },
        payment: true,
      },
    }),
  ]);

  if (!viewer || !booking) {
    return { viewer, booking: null };
  }

  const isAdmin = viewer.role === Role.ADMIN;
  const isBooker = viewer.bookerProfile?.id === booking.bookerId;
  const isArtist = viewer.artistProfile?.id === booking.artistId;

  if (!isAdmin && !isBooker && !isArtist) {
    throw new Error("FORBIDDEN");
  }

  return { viewer, booking };
}

function assertTransitionAllowed(input: {
  actorRole: Role | null;
  bookingStatus: BookingStatus;
  action: BookingUpdateInput["action"];
}) {
  const { actorRole, bookingStatus, action } = input;

  if (actorRole === Role.BOOKER) {
    if (action === "accept_quote" && bookingStatus === BookingStatus.QUOTE_RECEIVED) return;
    if (
      action === "cancel_by_booker" &&
      (bookingStatus === BookingStatus.ENQUIRY_SENT ||
        bookingStatus === BookingStatus.QUOTE_RECEIVED ||
        bookingStatus === BookingStatus.AWAITING_PAYMENT)
    ) {
      return;
    }
    if (
      action === "raise_dispute" &&
      (bookingStatus === BookingStatus.PAYMENT_HELD ||
        bookingStatus === BookingStatus.EVENT_COMPLETED)
    ) {
      return;
    }
  }

  if (actorRole === Role.ARTIST) {
    if (action === "send_quote" && bookingStatus === BookingStatus.ENQUIRY_SENT) return;
    if (
      action === "artist_decline" &&
      (bookingStatus === BookingStatus.ENQUIRY_SENT ||
        bookingStatus === BookingStatus.QUOTE_RECEIVED)
    ) {
      return;
    }
    if (
      action === "mark_completed" &&
      (bookingStatus === BookingStatus.PAYMENT_HELD ||
        bookingStatus === BookingStatus.EVENT_UPCOMING)
    ) {
      return;
    }
  }

  if (actorRole === Role.ADMIN) {
    if (action === "release_payout" && bookingStatus === BookingStatus.EVENT_COMPLETED) return;
    if (action === "raise_dispute") return;
  }

  throw new Error("Invalid action for this booking state.");
}

function getNextStatus(action: BookingUpdateInput["action"]) {
  switch (action) {
    case "send_quote":
      return BookingStatus.QUOTE_RECEIVED;
    case "accept_quote":
      return BookingStatus.AWAITING_PAYMENT;
    case "artist_accept":
      return BookingStatus.EVENT_UPCOMING;
    case "artist_decline":
      return BookingStatus.CANCELLED_BY_ARTIST;
    case "raise_dispute":
      return BookingStatus.DISPUTED;
    case "mark_completed":
      return BookingStatus.EVENT_COMPLETED;
    case "release_payout":
      return BookingStatus.PAYOUT_RELEASED;
    case "cancel_by_booker":
      return BookingStatus.CANCELLED_BY_BOOKER;
    default:
      return BookingStatus.ENQUIRY_SENT;
  }
}

export async function transitionBooking(bookingId: string, userId: string, payload: BookingUpdateInput) {
  const { viewer, booking } = await getAuthorizedBooking(bookingId, userId);

  if (!viewer || !booking) {
    throw new Error("Booking not found.");
  }

  assertTransitionAllowed({
    actorRole: viewer.role ?? null,
    bookingStatus: booking.status,
    action: payload.action,
  });

  const nextStatus = getNextStatus(payload.action);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus,
        escrowStatus:
          payload.action === "release_payout"
            ? EscrowStatus.RELEASED
            : payload.action === "raise_dispute"
              ? EscrowStatus.DISPUTED
              : booking.escrowStatus,
        quotedPrice:
          payload.action === "send_quote" && payload.quotedPrice
            ? payload.quotedPrice
            : booking.quotedPrice,
        platformFee:
          payload.action === "send_quote" && payload.quotedPrice
            ? Math.round(payload.quotedPrice * 0.1)
            : booking.platformFee,
        gstAmount:
          payload.action === "send_quote" && payload.quotedPrice
            ? Math.round(Math.round(payload.quotedPrice * 0.1) * 0.18)
            : booking.gstAmount,
        totalAmount:
          payload.action === "send_quote" && payload.quotedPrice
            ? payload.quotedPrice +
              Math.round(payload.quotedPrice * 0.1) +
              Math.round(Math.round(payload.quotedPrice * 0.1) * 0.18)
            : booking.totalAmount,
        artistPayout:
          payload.action === "send_quote" && payload.quotedPrice
            ? payload.quotedPrice
            : booking.artistPayout,
        cancelReason:
          payload.action === "artist_decline" || payload.action === "cancel_by_booker"
            ? payload.reason ?? booking.cancelReason
            : booking.cancelReason,
        disputeReason:
          payload.action === "raise_dispute"
            ? payload.reason ?? booking.disputeReason
            : booking.disputeReason,
        messages:
          payload.message || payload.reason
            ? {
                create: {
                  actor:
                    viewer.role === Role.ADMIN
                      ? ChatActor.ADMIN
                      : viewer.role === Role.ARTIST
                        ? ChatActor.ARTIST
                        : ChatActor.BOOKER,
                  body: payload.message ?? payload.reason ?? "Status updated.",
                },
              }
            : undefined,
      },
      include: {
        artist: true,
        booker: true,
      },
    });

    if (payload.action === "release_payout") {
      await tx.payment.updateMany({
        where: { bookingId },
        data: {
          status: PaymentStatus.PAID,
          releasedAt: new Date(),
        },
      });
    }

    return updatedBooking;
  });

  if (updated.artist.userId && viewer.role !== Role.ARTIST) {
    await createNotification({
      userId: updated.artist.userId,
      title: "Booking updated",
      body: `A booking for ${updated.eventName} is now ${nextStatus.replaceAll("_", " ")}.`,
      type: "BOOKING_UPDATE",
      actionUrl: `/booking/${updated.id}`,
    });
  }

  if (updated.booker.userId && viewer.role !== Role.BOOKER) {
    await createNotification({
      userId: updated.booker.userId,
      title: "Booking updated",
      body: `Your booking for ${updated.eventName} is now ${nextStatus.replaceAll("_", " ")}.`,
      type: "BOOKING_UPDATE",
      actionUrl: `/booking/${updated.id}`,
    });
  }

  return updated;
}

export async function createPendingPayment(bookingId: string, userId: string, payload: PaymentInput) {
  const { viewer, booking } = await getAuthorizedBooking(bookingId, userId);

  if (!viewer?.bookerProfile || viewer.role !== Role.BOOKER || !booking) {
    throw new Error("Login as a booker first.");
  }

  if (booking.bookerId !== viewer.bookerProfile.id) {
    throw new Error("This booking is not yours.");
  }

  if (booking.status !== BookingStatus.AWAITING_PAYMENT) {
    throw new Error("This booking is not ready for payment.");
  }

  const provider =
    payload.paymentMethod === "UPI" || payload.paymentMethod === "NETBANKING"
      ? PaymentProvider.RAZORPAY
      : PaymentProvider.STRIPE;

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    update: {
      provider,
      providerStatus: "pending_configuration",
      status: PaymentStatus.PENDING,
      failureMessage:
        "Payment gateway is not configured yet. Booking remains awaiting payment.",
      amount: booking.totalAmount ?? 0,
      platformFee: booking.platformFee ?? 0,
      gstAmount: booking.gstAmount ?? 0,
      artistPayout: booking.artistPayout ?? 0,
    },
    create: {
      bookingId,
      provider,
      providerStatus: "pending_configuration",
      status: PaymentStatus.PENDING,
      failureMessage:
        "Payment gateway is not configured yet. Booking remains awaiting payment.",
      amount: booking.totalAmount ?? 0,
      platformFee: booking.platformFee ?? 0,
      gstAmount: booking.gstAmount ?? 0,
      artistPayout: booking.artistPayout ?? 0,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      contractUrl: `/api/bookings/${bookingId}/contract`,
    },
  });

  return payment;
}

export async function saveBookingDraft(userId: string, artistId: string, data: Record<string, unknown>) {
  return prisma.bookingDraft.upsert({
    where: {
      userId_artistId: {
        userId,
        artistId,
      },
    },
    update: {
      data: data as Prisma.InputJsonValue,
    },
    create: {
      userId,
      artistId,
      data: data as Prisma.InputJsonValue,
    },
  });
}

export async function getBookingDraft(userId: string, artistId: string) {
  return prisma.bookingDraft.findUnique({
    where: {
      userId_artistId: {
        userId,
        artistId,
      },
    },
  });
}
