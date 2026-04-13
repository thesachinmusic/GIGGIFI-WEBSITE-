import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/giggifi";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseDate(value) {
  return value ? new Date(value) : null;
}

function parseDateArray(values) {
  return Array.isArray(values) ? values.filter(Boolean).map((value) => new Date(value)) : [];
}

function resolvePaymentProvider(payment) {
  if (payment.razorpayOrderId || payment.razorpayPaymentId) return "RAZORPAY";
  if (payment.stripePaymentIntentId) return "STRIPE";
  return "MANUAL";
}

async function loadMockDb() {
  const filePath = path.join(rootDir, "data", "mock-db.json");
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function clearDatabase() {
  const deletes = [
    () => prisma.session.deleteMany(),
    () => prisma.account.deleteMany(),
    () => prisma.verificationToken.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.savedArtist.deleteMany(),
    () => prisma.cart.deleteMany(),
    () => prisma.review.deleteMany(),
    () => prisma.payment.deleteMany(),
    () => prisma.bookingMessage.deleteMany(),
    () => prisma.booking.deleteMany(),
    () => prisma.bookingDraft.deleteMany(),
    () => prisma.onboardingDraft.deleteMany(),
    () => prisma.kYCDocument.deleteMany(),
    () => prisma.artistProfile.deleteMany(),
    () => prisma.bookerProfile.deleteMany(),
    () => prisma.otpChallenge.deleteMany(),
    () => prisma.user.deleteMany(),
  ];

  for (const runDelete of deletes) {
    await runDelete();
  }
}

async function seed() {
  const mockDb = await loadMockDb();
  await clearDatabase();

  const userByPhone = new Map();

  for (const user of mockDb.users) {
    const createdUser = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role ?? null,
        status: user.status,
        onboardingState: user.role ? "COMPLETE" : "ROLE_SELECTION",
        emailVerified: user.emailVerified ? new Date(user.createdAt) : null,
        phoneVerifiedAt: user.phone ? new Date(user.createdAt) : null,
        lastLoginAt: new Date(user.createdAt),
        createdAt: new Date(user.createdAt),
      },
    });
    if (createdUser.phone) {
      userByPhone.set(createdUser.phone, createdUser.id);
    }
  }

  for (const artist of mockDb.artists) {
    await prisma.artistProfile.create({
      data: {
        id: artist.id,
        userId: artist.userId,
        legalName: artist.legalName,
        stageName: artist.stageName,
        city: artist.city,
        state: artist.state,
        serviceableStates: artist.serviceableStates,
        category: artist.category,
        subcategory: artist.subcategory,
        genres: artist.genres,
        languages: artist.languages,
        performanceTypes: artist.performanceTypes,
        yearsExperience: artist.yearsExperience,
        bio: artist.bio,
        notableClients: artist.notableClients,
        portfolioPhotos: artist.portfolioPhotos,
        portfolioVideos: artist.portfolioVideos,
        audioSamples: artist.audioSamples,
        profilePhoto: artist.profilePhoto,
        coverPhoto: artist.coverPhoto,
        basePriceSolo: artist.basePriceSolo,
        basePriceBand: artist.basePriceBand ?? null,
        basePriceDJ: artist.basePriceDJ ?? null,
        travelIncluded: artist.travelIncluded,
        accommodationNeeded: artist.accommodationNeeded,
        minAdvanceBooking: artist.minAdvanceBooking,
        blackoutDates: parseDateArray(artist.blackoutDates),
        availableWeekdays: artist.availableWeekdays,
        availableWeekends: artist.availableWeekends,
        isAvailable: artist.isAvailable,
        aadhaarNumber: artist.aadhaarNumber ?? null,
        panNumber: artist.panNumber ?? null,
        gstNumber: artist.gstNumber ?? null,
        bankAccountNumber: artist.bankAccountNumber ?? null,
        bankIFSC: artist.bankIFSC ?? null,
        bankAccountName: artist.bankAccountName ?? null,
        stripeAccountId: artist.stripeAccountId ?? null,
        razorpayAccountId: artist.razorpayAccountId ?? null,
        kycStatus: artist.kycStatus,
        onboardingStep: artist.onboardingStep,
        rating: artist.rating,
        totalBookings: artist.totalBookings,
        termsAcceptedAt: parseDate(artist.termsAcceptedAt),
        featuredTag: artist.featuredTag,
        tagline: artist.tagline,
        packages: artist.packages,
        socials: artist.socials,
        mediaVault: artist.mediaVault,
      },
    });
  }

  for (const booker of mockDb.bookers) {
    await prisma.bookerProfile.create({
      data: {
        id: booker.id,
        userId: booker.userId,
        fullName: booker.fullName,
        email: booker.email,
        companyName: booker.companyName ?? null,
        bookerType: booker.bookerType,
        city: booker.city ?? null,
        state: booker.state ?? null,
        kycVerified: booker.kycVerified,
        termsAcceptedAt: parseDate(booker.termsAcceptedAt),
        howHeard: booker.howHeard ?? null,
        createdAt: new Date(booker.createdAt),
      },
    });
  }

  for (const cart of mockDb.carts) {
    await prisma.cart.create({
      data: {
        bookerId: cart.bookerId,
        artistIds: cart.artistIds,
        occasion: cart.occasion ?? null,
        city: cart.city ?? null,
        updatedAt: new Date(cart.updatedAt),
      },
    });
  }

  for (const item of mockDb.savedArtists) {
    await prisma.savedArtist.create({
      data: {
        id: item.id,
        bookerId: item.bookerId,
        artistId: item.artistId,
        savedAt: new Date(item.savedAt),
      },
    });
  }

  for (const notification of mockDb.notifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        read: notification.read,
        actionUrl: notification.actionUrl ?? null,
        createdAt: new Date(notification.createdAt),
      },
    });
  }

  for (const booking of mockDb.bookings) {
    await prisma.booking.create({
      data: {
        id: booking.id,
        bookerId: booking.bookerId,
        artistId: booking.artistId,
        bookingType: booking.bookingType,
        status: booking.status,
        eventName: booking.eventName,
        eventType: booking.eventType,
        eventDate: new Date(booking.eventDate),
        isFlexibleDate: booking.isFlexibleDate,
        alternateDates: parseDateArray(booking.alternateDates),
        eventStartTime: booking.eventStartTime ?? null,
        eventEndTime: booking.eventEndTime ?? null,
        venueType: booking.venueType ?? null,
        venueName: booking.venueName ?? null,
        venueAddress: booking.venueAddress ?? null,
        eventCity: booking.eventCity,
        eventState: booking.eventState ?? null,
        audienceSize: booking.audienceSize,
        duration: booking.duration,
        performanceType: booking.performanceType ?? null,
        languagePref: booking.languagePref,
        specialRequests: booking.specialRequests ?? null,
        soundAvailable: booking.soundAvailable,
        lightAvailable: booking.lightAvailable,
        travelArranged: booking.travelArranged,
        accomProvided: booking.accomProvided,
        budgetMin: booking.budgetMin ?? null,
        budgetMax: booking.budgetMax ?? null,
        contactPerson: booking.contactPerson ?? null,
        contactPhone: booking.contactPhone ?? null,
        responseUrgency: booking.responseUrgency ?? null,
        moodboardUrl: booking.moodboardUrl ?? null,
        quotedPrice: booking.quotedPrice ?? null,
        totalAmount: booking.totalAmount ?? null,
        platformFee: booking.platformFee ?? null,
        gstAmount: booking.gstAmount ?? null,
        artistPayout: booking.artistPayout ?? null,
        escrowStatus: booking.escrowStatus,
        contractUrl: booking.contractUrl ?? null,
        disputeReason: booking.disputeReason ?? null,
        cancelReason: booking.cancelReason ?? null,
        quickBookPackage: booking.quickBookPackage ?? null,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt),
        messages: {
          create: booking.chat.map((message) => ({
            id: message.id,
            actor: message.from === "SYSTEM" ? "SYSTEM" : message.from,
            body: message.body,
            createdAt: new Date(message.createdAt),
          })),
        },
      },
    });
  }

  for (const review of mockDb.reviews) {
    await prisma.review.create({
      data: {
        id: review.id,
        bookingId: review.bookingId,
        fromId: review.fromId,
        toId: review.toId,
        rating: review.rating,
        comment: review.comment,
        eventType: review.eventType ?? null,
        createdAt: new Date(review.createdAt),
      },
    });
  }

  for (const payment of mockDb.payments) {
    await prisma.payment.create({
      data: {
        id: payment.id,
        bookingId: payment.bookingId,
        provider: resolvePaymentProvider(payment),
        providerOrderId: payment.razorpayOrderId ?? null,
        providerPaymentId:
          payment.razorpayPaymentId ?? payment.stripePaymentIntentId ?? null,
        providerStatus: payment.status.toLowerCase(),
        amount: payment.amount,
        platformFee: payment.platformFee,
        gstAmount: payment.gstAmount,
        artistPayout: payment.artistPayout,
        status: payment.status === "PENDING" ? "PENDING" : payment.status,
        paidAt: parseDate(payment.paidAt),
        releasedAt: parseDate(payment.releasedAt),
        refundedAt: parseDate(payment.refundedAt),
        refundAmount: payment.refundAmount ?? null,
        createdAt: new Date(payment.createdAt),
      },
    });
  }

  for (const draft of mockDb.onboardingDrafts) {
    const userId = userByPhone.get(draft.phone);
    if (!userId) continue;

    await prisma.onboardingDraft.create({
      data: {
        userId,
        role: draft.role,
        step: draft.step,
        data: draft.data,
        updatedAt: new Date(draft.updatedAt),
      },
    });
  }

  console.log("GiggiFi seed import completed.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
