-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ARTIST', 'BOOKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OnboardingState" AS ENUM ('ROLE_SELECTION', 'PROFILE_IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('ENQUIRY', 'QUICK_BOOKING');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('NOT_INITIATED', 'HELD', 'RELEASING', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('AADHAAR', 'PAN', 'GST', 'BANK_PROOF');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookerType" AS ENUM ('INDIVIDUAL', 'CORPORATE', 'PLANNER', 'AGENCY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ENQUIRY_SENT', 'ENQUIRY_VIEWED', 'QUOTE_RECEIVED', 'QUOTE_ACCEPTED', 'AWAITING_PAYMENT', 'PAYMENT_HELD', 'EVENT_UPCOMING', 'EVENT_COMPLETED', 'PAYOUT_PROCESSING', 'PAYOUT_RELEASED', 'CANCELLED_BY_BOOKER', 'CANCELLED_BY_ARTIST', 'DISPUTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ChatActor" AS ENUM ('ARTIST', 'BOOKER', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "role" "Role",
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "onboardingState" "OnboardingState" NOT NULL DEFAULT 'ROLE_SELECTION',
    "emailVerified" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "profilePhoto" TEXT,
    "coverPhoto" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "serviceableStates" TEXT[],
    "category" TEXT NOT NULL,
    "subcategory" TEXT[],
    "genres" TEXT[],
    "languages" TEXT[],
    "performanceTypes" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "notableClients" TEXT,
    "portfolioPhotos" TEXT[],
    "portfolioVideos" TEXT[],
    "audioSamples" TEXT[],
    "basePriceSolo" INTEGER NOT NULL DEFAULT 0,
    "basePriceBand" INTEGER,
    "basePriceDJ" INTEGER,
    "travelIncluded" TEXT NOT NULL DEFAULT 'NEGOTIABLE',
    "accommodationNeeded" BOOLEAN NOT NULL DEFAULT false,
    "minAdvanceBooking" INTEGER NOT NULL DEFAULT 7,
    "blackoutDates" TIMESTAMP(3)[],
    "availableWeekdays" BOOLEAN NOT NULL DEFAULT true,
    "availableWeekends" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "aadhaarNumber" TEXT,
    "panNumber" TEXT,
    "gstNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankIFSC" TEXT,
    "bankAccountName" TEXT,
    "stripeAccountId" TEXT,
    "razorpayAccountId" TEXT,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "termsAcceptedAt" TIMESTAMP(3),
    "featuredTag" TEXT,
    "tagline" TEXT,
    "packages" JSONB,
    "socials" JSONB,
    "mediaVault" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "bookerType" "BookerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "city" TEXT,
    "state" TEXT,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "howHeard" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookerId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "bookingType" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'ENQUIRY_SENT',
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "isFlexibleDate" BOOLEAN NOT NULL DEFAULT false,
    "alternateDates" TIMESTAMP(3)[],
    "eventStartTime" TEXT,
    "eventEndTime" TEXT,
    "venueType" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "eventCity" TEXT NOT NULL,
    "eventState" TEXT,
    "audienceSize" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "performanceType" TEXT,
    "languagePref" TEXT[],
    "specialRequests" TEXT,
    "soundAvailable" BOOLEAN NOT NULL DEFAULT false,
    "lightAvailable" BOOLEAN NOT NULL DEFAULT false,
    "travelArranged" BOOLEAN NOT NULL DEFAULT false,
    "accomProvided" BOOLEAN NOT NULL DEFAULT false,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "responseUrgency" TEXT,
    "moodboardUrl" TEXT,
    "quotedPrice" INTEGER,
    "totalAmount" INTEGER,
    "platformFee" INTEGER,
    "gstAmount" INTEGER,
    "artistPayout" INTEGER,
    "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'NOT_INITIATED',
    "contractUrl" TEXT,
    "disputeReason" TEXT,
    "cancelReason" TEXT,
    "quickBookPackage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actor" "ChatActor" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" "PaymentProvider",
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "providerStatus" TEXT,
    "transactionReference" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "gstAmount" INTEGER NOT NULL,
    "artistPayout" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorizedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYCDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KYCDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "eventType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedArtist" (
    "id" TEXT NOT NULL,
    "bookerId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "bookerId" TEXT NOT NULL,
    "artistIds" TEXT[],
    "occasion" TEXT,
    "city" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "step" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriedAt" TIMESTAMP(3),

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "oauth_token_secret" TEXT,
    "oauth_token" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookerProfile_userId_key" ON "BookerProfile"("userId");

-- CreateIndex
CREATE INDEX "Booking_bookerId_idx" ON "Booking"("bookerId");

-- CreateIndex
CREATE INDEX "Booking_artistId_idx" ON "Booking"("artistId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "BookingMessage_bookingId_createdAt_idx" ON "BookingMessage"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "KYCDocument_userId_idx" ON "KYCDocument"("userId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedArtist_bookerId_idx" ON "SavedArtist"("bookerId");

-- CreateIndex
CREATE INDEX "SavedArtist_artistId_idx" ON "SavedArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedArtist_bookerId_artistId_key" ON "SavedArtist"("bookerId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_bookerId_key" ON "Cart"("bookerId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingDraft_userId_key" ON "OnboardingDraft"("userId");

-- CreateIndex
CREATE INDEX "BookingDraft_userId_idx" ON "BookingDraft"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDraft_userId_artistId_key" ON "BookingDraft"("userId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpChallenge_phone_key" ON "OtpChallenge"("phone");

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookerProfile" ADD CONSTRAINT "BookerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "BookerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYCDocument" ADD CONSTRAINT "KYCDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedArtist" ADD CONSTRAINT "SavedArtist_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "BookerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedArtist" ADD CONSTRAINT "SavedArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "BookerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingDraft" ADD CONSTRAINT "OnboardingDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
