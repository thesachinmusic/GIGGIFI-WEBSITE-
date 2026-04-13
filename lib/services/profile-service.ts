import "server-only";

import { OnboardingState, Role, UserStatus } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notification-service";
import {
  artistOnboardingSchema,
  bookerOnboardingSchema,
  onboardingDraftSchema,
} from "@/lib/validations";

type ArtistOnboardingInput = z.infer<typeof artistOnboardingSchema>;
type BookerOnboardingInput = z.infer<typeof bookerOnboardingSchema>;
type OnboardingDraftInput = z.infer<typeof onboardingDraftSchema>;

function parseOptionalDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getOnboardingDraft(userId: string) {
  return prisma.onboardingDraft.findUnique({
    where: { userId },
  });
}

export async function saveOnboardingDraft(userId: string, input: OnboardingDraftInput) {
  return prisma.onboardingDraft.upsert({
    where: { userId },
    update: {
      role: input.role,
      step: input.step,
      data: input.data,
    },
    create: {
      userId,
      role: input.role,
      step: input.step,
      data: input.data,
    },
  });
}

export async function completeArtistOnboarding(userId: string, payload: ArtistOnboardingInput & Record<string, unknown>) {
  if (payload.bankAccountNumber !== payload.confirmBankAccountNumber) {
    throw new Error("Bank account numbers do not match.");
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        role: Role.ARTIST,
        name: payload.stageName,
        onboardingState: OnboardingState.COMPLETE,
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    const artist = await tx.artistProfile.upsert({
      where: { userId },
      update: {
        legalName: payload.legalName,
        stageName: payload.stageName,
        dateOfBirth: parseOptionalDate(payload.dateOfBirth),
        gender: payload.gender,
        profilePhoto: typeof payload.profilePhoto === "string" ? payload.profilePhoto : null,
        coverPhoto: typeof payload.coverPhoto === "string" ? payload.coverPhoto : null,
        city: payload.city,
        state: payload.state,
        serviceableStates: payload.serviceableStates,
        category: payload.category,
        subcategory: payload.subcategory,
        genres: payload.genres,
        languages: payload.languages,
        performanceTypes: payload.performanceTypes,
        yearsExperience: payload.yearsExperience,
        bio: payload.bio,
        notableClients:
          typeof payload.notableClients === "string" ? payload.notableClients : "",
        portfolioPhotos: payload.portfolioPhotos,
        portfolioVideos: Array.isArray(payload.portfolioVideos)
          ? (payload.portfolioVideos as string[])
          : [],
        audioSamples: Array.isArray(payload.audioSamples)
          ? (payload.audioSamples as string[])
          : [],
        basePriceSolo: payload.packages[0]?.price ?? 0,
        basePriceDJ: payload.packages[1]?.price ?? null,
        basePriceBand: payload.packages[2]?.price ?? null,
        travelIncluded:
          typeof payload.travelIncluded === "string" ? payload.travelIncluded : "NEGOTIABLE",
        accommodationNeeded: Boolean(payload.accommodationNeeded),
        minAdvanceBooking:
          typeof payload.minAdvanceBooking === "number" ? payload.minAdvanceBooking : 7,
        blackoutDates: Array.isArray(payload.blackoutDates)
          ? (payload.blackoutDates as string[]).map((value) => new Date(value))
          : [],
        availableWeekdays:
          typeof payload.availableWeekdays === "boolean" ? payload.availableWeekdays : true,
        availableWeekends:
          typeof payload.availableWeekends === "boolean" ? payload.availableWeekends : true,
        aadhaarNumber: payload.aadhaarNumber,
        panNumber: payload.panNumber,
        gstNumber: typeof payload.gstNumber === "string" ? payload.gstNumber : null,
        bankAccountNumber: payload.bankAccountNumber,
        bankIFSC: payload.bankIFSC,
        bankAccountName: payload.bankAccountName,
        onboardingStep: 7,
        termsAcceptedAt: now,
        featuredTag: "New premium artist",
        tagline: payload.genres.join(" • "),
        packages: payload.packages,
        socials: {
          instagramUrl:
            typeof payload.instagramUrl === "string" ? payload.instagramUrl : "",
          youtubeUrl: typeof payload.youtubeUrl === "string" ? payload.youtubeUrl : "",
          spotifyUrl: typeof payload.spotifyUrl === "string" ? payload.spotifyUrl : "",
          facebookUrl:
            typeof payload.facebookUrl === "string" ? payload.facebookUrl : "",
          websiteUrl: typeof payload.websiteUrl === "string" ? payload.websiteUrl : "",
        },
        mediaVault: [
          { label: "Press kit PDF", description: "Awaiting upload", status: "Pending" },
          { label: "Reel", description: "Awaiting upload", status: "Pending" },
          { label: "Performance video", description: "Awaiting upload", status: "Pending" },
          { label: "Profile photo", description: "Uploaded", status: "Ready" },
          { label: "Package deck", description: "Generated from pricing", status: "Ready" },
          { label: "KYC bundle", description: "Submitted for review", status: "Pending" },
        ],
      },
      create: {
        userId,
        legalName: payload.legalName,
        stageName: payload.stageName,
        dateOfBirth: parseOptionalDate(payload.dateOfBirth),
        gender: payload.gender,
        profilePhoto: typeof payload.profilePhoto === "string" ? payload.profilePhoto : null,
        coverPhoto: typeof payload.coverPhoto === "string" ? payload.coverPhoto : null,
        city: payload.city,
        state: payload.state,
        serviceableStates: payload.serviceableStates,
        category: payload.category,
        subcategory: payload.subcategory,
        genres: payload.genres,
        languages: payload.languages,
        performanceTypes: payload.performanceTypes,
        yearsExperience: payload.yearsExperience,
        bio: payload.bio,
        notableClients:
          typeof payload.notableClients === "string" ? payload.notableClients : "",
        portfolioPhotos: payload.portfolioPhotos,
        portfolioVideos: Array.isArray(payload.portfolioVideos)
          ? (payload.portfolioVideos as string[])
          : [],
        audioSamples: Array.isArray(payload.audioSamples)
          ? (payload.audioSamples as string[])
          : [],
        basePriceSolo: payload.packages[0]?.price ?? 0,
        basePriceDJ: payload.packages[1]?.price ?? null,
        basePriceBand: payload.packages[2]?.price ?? null,
        travelIncluded:
          typeof payload.travelIncluded === "string" ? payload.travelIncluded : "NEGOTIABLE",
        accommodationNeeded: Boolean(payload.accommodationNeeded),
        minAdvanceBooking:
          typeof payload.minAdvanceBooking === "number" ? payload.minAdvanceBooking : 7,
        blackoutDates: Array.isArray(payload.blackoutDates)
          ? (payload.blackoutDates as string[]).map((value) => new Date(value))
          : [],
        availableWeekdays:
          typeof payload.availableWeekdays === "boolean" ? payload.availableWeekdays : true,
        availableWeekends:
          typeof payload.availableWeekends === "boolean" ? payload.availableWeekends : true,
        aadhaarNumber: payload.aadhaarNumber,
        panNumber: payload.panNumber,
        gstNumber: typeof payload.gstNumber === "string" ? payload.gstNumber : null,
        bankAccountNumber: payload.bankAccountNumber,
        bankIFSC: payload.bankIFSC,
        bankAccountName: payload.bankAccountName,
        onboardingStep: 7,
        termsAcceptedAt: now,
        featuredTag: "New premium artist",
        tagline: payload.genres.join(" • "),
        packages: payload.packages,
        socials: {
          instagramUrl:
            typeof payload.instagramUrl === "string" ? payload.instagramUrl : "",
          youtubeUrl: typeof payload.youtubeUrl === "string" ? payload.youtubeUrl : "",
          spotifyUrl: typeof payload.spotifyUrl === "string" ? payload.spotifyUrl : "",
          facebookUrl:
            typeof payload.facebookUrl === "string" ? payload.facebookUrl : "",
          websiteUrl: typeof payload.websiteUrl === "string" ? payload.websiteUrl : "",
        },
        mediaVault: [
          { label: "Press kit PDF", description: "Awaiting upload", status: "Pending" },
          { label: "Reel", description: "Awaiting upload", status: "Pending" },
          { label: "Performance video", description: "Awaiting upload", status: "Pending" },
          { label: "Profile photo", description: "Uploaded", status: "Ready" },
          { label: "Package deck", description: "Generated from pricing", status: "Ready" },
          { label: "KYC bundle", description: "Submitted for review", status: "Pending" },
        ],
      },
    });

    await tx.onboardingDraft.deleteMany({
      where: { userId },
    });

    return { user, artist };
  });

  await createNotification({
    userId,
    title: "KYC submitted",
    body: "Your artist profile was created and is now awaiting verification.",
    type: "KYC_SUBMITTED",
    actionUrl: "/artist/dashboard",
  });

  return result;
}

export async function completeBookerOnboarding(userId: string, payload: BookerOnboardingInput & Record<string, unknown>) {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        role: Role.BOOKER,
        name: payload.fullName,
        email: payload.email,
        onboardingState: OnboardingState.COMPLETE,
        status: UserStatus.ACTIVE,
      },
    });

    const booker = await tx.bookerProfile.upsert({
      where: { userId },
      update: {
        fullName: payload.fullName,
        email: payload.email,
        companyName: payload.companyName,
        bookerType: payload.bookerType,
        city: payload.city,
        state: payload.state,
        howHeard: typeof payload.howHeard === "string" ? payload.howHeard : null,
        kycVerified: true,
        termsAcceptedAt: now,
      },
      create: {
        userId,
        fullName: payload.fullName,
        email: payload.email,
        companyName: payload.companyName,
        bookerType: payload.bookerType,
        city: payload.city,
        state: payload.state,
        howHeard: typeof payload.howHeard === "string" ? payload.howHeard : null,
        kycVerified: true,
        termsAcceptedAt: now,
      },
    });

    await tx.onboardingDraft.deleteMany({
      where: { userId },
    });

    return { user, booker };
  });

  await createNotification({
    userId,
    title: "Welcome to GiggiFi",
    body: "Your booker profile is ready to start sending enquiries and bookings.",
    type: "BOOKER_PROFILE_READY",
    actionUrl: "/booker/dashboard",
  });

  return result;
}
