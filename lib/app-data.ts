import "server-only";

import {
  type ArtistPackage,
  type ArtistRecord,
  type BookerRecord,
  type BookingRecord,
  type CartRecord,
  type MockDatabase,
  type NotificationRecord,
  type OnboardingDraftRecord,
  type PaymentRecord,
  type ReviewRecord,
  type SavedArtistRecord,
  type UserRecord,
} from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

function asArtistPackages(value: unknown): ArtistPackage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      if (
        typeof candidate.title !== "string" ||
        typeof candidate.description !== "string" ||
        typeof candidate.price !== "number"
      ) {
        return null;
      }

      return {
        title: candidate.title,
        description: candidate.description,
        price: candidate.price,
      };
    })
    .filter((item): item is ArtistPackage => Boolean(item));
}

function asObject<T extends object>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asArtistRecord(input: Awaited<ReturnType<typeof prisma.artistProfile.findMany>>[number]): ArtistRecord {
  const socials = asObject(input.socials, {
    instagramUrl: "",
    youtubeUrl: "",
    spotifyUrl: "",
    facebookUrl: "",
    websiteUrl: "",
  });
  const mediaVault = Array.isArray(input.mediaVault)
    ? (input.mediaVault as ArtistRecord["mediaVault"])
    : [];

  return {
    id: input.id,
    userId: input.userId,
    legalName: input.legalName,
    stageName: input.stageName,
    city: input.city,
    state: input.state,
    serviceableStates: input.serviceableStates,
    category: input.category,
    subcategory: input.subcategory,
    genres: input.genres,
    languages: input.languages,
    performanceTypes: input.performanceTypes,
    yearsExperience: input.yearsExperience,
    bio: input.bio ?? "",
    notableClients: input.notableClients ?? "",
    portfolioPhotos: input.portfolioPhotos,
    portfolioVideos: input.portfolioVideos,
    audioSamples: input.audioSamples,
    profilePhoto: input.profilePhoto ?? "",
    coverPhoto: input.coverPhoto ?? "",
    basePriceSolo: input.basePriceSolo,
    basePriceBand: input.basePriceBand ?? undefined,
    basePriceDJ: input.basePriceDJ ?? undefined,
    travelIncluded: (input.travelIncluded as ArtistRecord["travelIncluded"]) ?? "NEGOTIABLE",
    accommodationNeeded: input.accommodationNeeded,
    minAdvanceBooking: input.minAdvanceBooking,
    blackoutDates: input.blackoutDates.map((date) => date.toISOString()),
    availableWeekdays: input.availableWeekdays,
    availableWeekends: input.availableWeekends,
    isAvailable: input.isAvailable,
    aadhaarNumber: input.aadhaarNumber ?? undefined,
    panNumber: input.panNumber ?? undefined,
    gstNumber: input.gstNumber ?? undefined,
    bankAccountNumber: input.bankAccountNumber ?? undefined,
    bankIFSC: input.bankIFSC ?? undefined,
    bankAccountName: input.bankAccountName ?? undefined,
    stripeAccountId: input.stripeAccountId ?? undefined,
    razorpayAccountId: input.razorpayAccountId ?? undefined,
    kycStatus: input.kycStatus,
    onboardingStep: input.onboardingStep,
    rating: input.rating,
    totalBookings: input.totalBookings,
    termsAcceptedAt: input.termsAcceptedAt?.toISOString(),
    featuredTag: input.featuredTag ?? "Featured Artist",
    tagline: input.tagline ?? "",
    packages: asArtistPackages(input.packages),
    socials: {
      instagramUrl: typeof socials.instagramUrl === "string" ? socials.instagramUrl : undefined,
      youtubeUrl: typeof socials.youtubeUrl === "string" ? socials.youtubeUrl : undefined,
      spotifyUrl: typeof socials.spotifyUrl === "string" ? socials.spotifyUrl : undefined,
      facebookUrl: typeof socials.facebookUrl === "string" ? socials.facebookUrl : undefined,
      websiteUrl: typeof socials.websiteUrl === "string" ? socials.websiteUrl : undefined,
    },
    mediaVault,
  };
}

export async function loadAppData(): Promise<MockDatabase> {
  const [
    users,
    artists,
    bookers,
    bookings,
    payments,
    reviews,
    notifications,
    savedArtists,
    carts,
    onboardingDrafts,
  ] = await prisma.$transaction([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.artistProfile.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.bookerProfile.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "desc" } }, payment: true },
    }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.savedArtist.findMany({ orderBy: { savedAt: "desc" } }),
    prisma.cart.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.onboardingDraft.findMany({
      include: { user: { select: { phone: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    users: users.map<UserRecord>((user) => ({
      id: user.id,
      phone: user.phone ?? "",
      email: user.email ?? undefined,
      role: (user.role ?? "BOOKER") as UserRecord["role"],
      status: user.status,
      name: user.name ?? user.phone ?? "GiggiFi User",
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt.toISOString(),
    })),
    artists: artists.map(asArtistRecord),
    bookers: bookers.map<BookerRecord>((booker) => ({
      id: booker.id,
      userId: booker.userId,
      fullName: booker.fullName,
      email: booker.email,
      companyName: booker.companyName ?? undefined,
      bookerType: booker.bookerType,
      city: booker.city ?? undefined,
      state: booker.state ?? undefined,
      kycVerified: booker.kycVerified,
      termsAcceptedAt: booker.termsAcceptedAt?.toISOString(),
      howHeard: booker.howHeard ?? undefined,
      createdAt: booker.createdAt.toISOString(),
    })),
    bookings: bookings.map<BookingRecord>((booking) => ({
      id: booking.id,
      bookerId: booking.bookerId,
      artistId: booking.artistId,
      bookingType: booking.bookingType,
      status: booking.status,
      eventName: booking.eventName,
      eventType: booking.eventType,
      eventDate: booking.eventDate.toISOString(),
      isFlexibleDate: booking.isFlexibleDate,
      alternateDates: booking.alternateDates.map((date) => date.toISOString()),
      eventStartTime: booking.eventStartTime ?? undefined,
      eventEndTime: booking.eventEndTime ?? undefined,
      venueType: booking.venueType ?? undefined,
      venueName: booking.venueName ?? undefined,
      venueAddress: booking.venueAddress ?? undefined,
      eventCity: booking.eventCity,
      eventState: booking.eventState ?? undefined,
      audienceSize: booking.audienceSize,
      duration: booking.duration,
      performanceType: booking.performanceType ?? undefined,
      languagePref: booking.languagePref,
      specialRequests: booking.specialRequests ?? undefined,
      soundAvailable: booking.soundAvailable,
      lightAvailable: booking.lightAvailable,
      travelArranged: booking.travelArranged,
      accomProvided: booking.accomProvided,
      budgetMin: booking.budgetMin ?? undefined,
      budgetMax: booking.budgetMax ?? undefined,
      contactPerson: booking.contactPerson ?? undefined,
      contactPhone: booking.contactPhone ?? undefined,
      responseUrgency: booking.responseUrgency ?? undefined,
      moodboardUrl: booking.moodboardUrl ?? undefined,
      quotedPrice: booking.quotedPrice ?? undefined,
      totalAmount: booking.totalAmount ?? undefined,
      platformFee: booking.platformFee ?? undefined,
      gstAmount: booking.gstAmount ?? undefined,
      artistPayout: booking.artistPayout ?? undefined,
      escrowStatus: booking.escrowStatus,
      contractUrl: booking.contractUrl ?? undefined,
      paymentId: booking.payment?.id,
      disputeReason: booking.disputeReason ?? undefined,
      cancelReason: booking.cancelReason ?? undefined,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      quickBookPackage: booking.quickBookPackage ?? undefined,
      chat: booking.messages.map((message) => ({
        id: message.id,
        from:
          message.actor === "SYSTEM" || message.actor === "ADMIN"
            ? "SYSTEM"
            : message.actor,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      })),
    })),
    payments: payments.map<PaymentRecord>((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      platformFee: payment.platformFee,
      gstAmount: payment.gstAmount,
      artistPayout: payment.artistPayout,
      status:
        payment.status === "REQUIRES_ACTION"
          ? "PENDING"
          : payment.status === "CANCELLED"
            ? "FAILED"
            : payment.status,
      paidAt: payment.paidAt?.toISOString(),
      releasedAt: payment.releasedAt?.toISOString(),
      refundedAt: payment.refundedAt?.toISOString(),
      refundAmount: payment.refundAmount ?? undefined,
      razorpayOrderId: payment.provider === "RAZORPAY" ? payment.providerOrderId ?? undefined : undefined,
      razorpayPaymentId:
        payment.provider === "RAZORPAY" ? payment.providerPaymentId ?? undefined : undefined,
      stripePaymentIntentId:
        payment.provider === "STRIPE" ? payment.providerPaymentId ?? undefined : undefined,
      createdAt: payment.createdAt.toISOString(),
    })),
    reviews: reviews.map<ReviewRecord>((review) => ({
      id: review.id,
      bookingId: review.bookingId,
      fromId: review.fromId,
      toId: review.toId,
      rating: review.rating,
      comment: review.comment,
      eventType: review.eventType ?? undefined,
      createdAt: review.createdAt.toISOString(),
    })),
    notifications: notifications.map<NotificationRecord>((notification) => ({
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      read: notification.read,
      actionUrl: notification.actionUrl ?? undefined,
      createdAt: notification.createdAt.toISOString(),
    })),
    savedArtists: savedArtists.map<SavedArtistRecord>((item) => ({
      id: item.id,
      bookerId: item.bookerId,
      artistId: item.artistId,
      savedAt: item.savedAt.toISOString(),
    })),
    carts: carts.map<CartRecord>((cart) => ({
      bookerId: cart.bookerId,
      artistIds: cart.artistIds,
      occasion: cart.occasion ?? undefined,
      city: cart.city ?? undefined,
      updatedAt: cart.updatedAt.toISOString(),
    })),
    otpRequests: [],
    onboardingDrafts: onboardingDrafts.map<OnboardingDraftRecord>((draft) => ({
      phone: draft.user.phone ?? "",
      role: draft.role as OnboardingDraftRecord["role"],
      step: draft.step,
      data: asObject(draft.data, {}),
      updatedAt: draft.updatedAt.toISOString(),
    })),
  };
}

export async function loadViewerData(userId?: string) {
  if (!userId) {
    return {
      sessionUser: null,
      appData: await loadAppData(),
    };
  }

  const [sessionUser, appData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        artistProfile: true,
        bookerProfile: true,
      },
    }),
    loadAppData(),
  ]);

  return {
    sessionUser,
    appData,
  };
}

export function parseStoredJsonArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function parseStoredStringArray(value: unknown) {
  return asStringArray(value);
}
