import { NextResponse } from "next/server";
import { buildDashboardPath, type ArtistRecord } from "@/lib/mock-data";
import { applySession, clearPendingPhone, getPendingPhoneFromCookies } from "@/lib/session";
import { createNotification, makeId, readDb, updateDb } from "@/lib/server-db";
import {
  artistOnboardingSchema,
  bookerOnboardingSchema,
} from "@/lib/validations";

export async function POST(request: Request) {
  const phone = getPendingPhoneFromCookies();
  if (!phone) {
    return NextResponse.json({ error: "Verify your phone first." }, { status: 401 });
  }

  const body = await request.json();
  const role = body.role as "ARTIST" | "BOOKER";

  if (role === "ARTIST") {
    const parsed = artistOnboardingSchema.safeParse(body.payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
      return NextResponse.json(
        { error: firstFieldError ?? "Please complete all artist steps." },
        { status: 400 },
      );
    }
    if (parsed.data.bankAccountNumber !== parsed.data.confirmBankAccountNumber) {
      return NextResponse.json({ error: "Bank account numbers do not match." }, { status: 400 });
    }

    const userId = makeId("user");
    const artistId = makeId("artist");
    await updateDb((db) => {
      db.users.push({
        id: userId,
        phone,
        email: undefined,
        role: "ARTIST",
        status: "PENDING_VERIFICATION",
        name: parsed.data.stageName,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      const artist: ArtistRecord = {
        id: artistId,
        userId,
        legalName: parsed.data.legalName,
        stageName: parsed.data.stageName,
        city: parsed.data.city,
        state: parsed.data.state,
        serviceableStates: parsed.data.serviceableStates,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory,
        genres: parsed.data.genres,
        languages: parsed.data.languages,
        performanceTypes: parsed.data.performanceTypes,
        yearsExperience: parsed.data.yearsExperience,
        bio: parsed.data.bio,
        notableClients: String(body.payload.notableClients ?? ""),
        portfolioPhotos: parsed.data.portfolioPhotos,
        portfolioVideos: Array.isArray(body.payload.portfolioVideos)
          ? body.payload.portfolioVideos
          : [],
        audioSamples: Array.isArray(body.payload.audioSamples)
          ? body.payload.audioSamples
          : [],
        profilePhoto:
          String(body.payload.profilePhoto ?? "") ||
          "https://picsum.photos/seed/giggifi-onboard-artist/800/800",
        coverPhoto:
          String(body.payload.coverPhoto ?? "") ||
          "https://picsum.photos/seed/giggifi-onboard-cover/1600/900",
        basePriceSolo: parsed.data.packages[0]?.price ?? 0,
        basePriceBand: parsed.data.packages[2]?.price,
        basePriceDJ: parsed.data.packages[1]?.price,
        travelIncluded: String(body.payload.travelIncluded ?? "NEGOTIABLE") as "YES" | "NO" | "NEGOTIABLE",
        accommodationNeeded: Boolean(body.payload.accommodationNeeded),
        minAdvanceBooking: Number(body.payload.minAdvanceBooking ?? 7),
        blackoutDates: Array.isArray(body.payload.blackoutDates) ? body.payload.blackoutDates : [],
        availableWeekdays: Boolean(body.payload.availableWeekdays ?? true),
        availableWeekends: Boolean(body.payload.availableWeekends ?? true),
        isAvailable: true,
        aadhaarNumber: parsed.data.aadhaarNumber,
        panNumber: parsed.data.panNumber,
        gstNumber: String(body.payload.gstNumber ?? ""),
        bankAccountNumber: parsed.data.bankAccountNumber,
        bankIFSC: parsed.data.bankIFSC,
        bankAccountName: parsed.data.bankAccountName,
        stripeAccountId: `acct_${artistId}`,
        razorpayAccountId: `rzp_${artistId}`,
        kycStatus: "PENDING",
        onboardingStep: 7,
        rating: 0,
        totalBookings: 0,
        termsAcceptedAt: new Date().toISOString(),
        featuredTag: "New premium artist",
        tagline: parsed.data.genres.join(" • "),
        packages: parsed.data.packages,
        socials: {
          instagramUrl: String(body.payload.instagramUrl ?? ""),
          youtubeUrl: String(body.payload.youtubeUrl ?? ""),
          spotifyUrl: String(body.payload.spotifyUrl ?? ""),
          facebookUrl: String(body.payload.facebookUrl ?? ""),
          websiteUrl: String(body.payload.websiteUrl ?? ""),
        },
        mediaVault: [
          { label: "Press kit PDF", description: "Awaiting upload", status: "Pending" },
          { label: "Reel", description: "Awaiting upload", status: "Pending" },
          { label: "Performance video", description: "Awaiting upload", status: "Pending" },
          { label: "Profile photo", description: "Uploaded", status: "Ready" },
          { label: "Package deck", description: "Generated from pricing", status: "Ready" },
          { label: "KYC bundle", description: "Submitted for review", status: "Pending" },
        ],
      };
      db.artists.unshift(artist);
      db.onboardingDrafts = db.onboardingDrafts.filter((item) => item.phone !== phone);
    });

    await createNotification({
      userId,
      title: "KYC submitted",
      body: "Your KYC documents have been received. We verify within 24–48 hours.",
      type: "KYC_SUBMITTED",
      actionUrl: "/artist/dashboard",
    });

    const response = NextResponse.json({
      success: true,
      redirect: buildDashboardPath("ARTIST"),
      artistId,
      profilePath: `/booker/artist/${artistId}`,
    });
    applySession(response, {
      userId,
      role: "ARTIST",
      phone,
      name: parsed.data.stageName,
    });
    clearPendingPhone(response);
    return response;
  }

  const parsed = bookerOnboardingSchema.safeParse(body.payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { error: firstFieldError ?? "Please complete all booker steps." },
      { status: 400 },
    );
  }

  const userId = makeId("user");
  await updateDb((db) => {
    db.users.push({
      id: userId,
      phone,
      email: parsed.data.email,
      role: "BOOKER",
      status: "ACTIVE",
      name: parsed.data.fullName,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });
    db.bookers.push({
      id: makeId("booker"),
      userId,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      companyName: parsed.data.companyName,
      bookerType: parsed.data.bookerType,
      city: parsed.data.city,
      state: parsed.data.state,
      kycVerified: true,
      howHeard: String(body.payload.howHeard ?? ""),
      termsAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    db.onboardingDrafts = db.onboardingDrafts.filter((item) => item.phone !== phone);
  });

  await createNotification({
    userId,
    title: "Welcome to GiggiFi",
    body: "Your email has been verified. Welcome to GiggiFi!",
    type: "EMAIL_VERIFIED",
    actionUrl: "/booker/dashboard",
  });

  const response = NextResponse.json({
    success: true,
    redirect: buildDashboardPath("BOOKER"),
  });
  applySession(response, {
    userId,
    role: "BOOKER",
    phone,
    name: parsed.data.fullName,
  });
  clearPendingPhone(response);
  return response;
}
