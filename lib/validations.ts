import { z } from "zod";

export function normalizeIndianPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(3)}`;
  return input.trim();
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizeIndianPhone)
  .refine((value) => /^\+91\d{10}$/.test(value), "Use Indian format like +919876543210");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit OTP");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const completeContactSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "Name is too long")
    .optional(),
});

export const selectRoleSchema = z.object({
  role: z.enum(["ARTIST", "BOOKER"]),
});

export const onboardingDraftSchema = z.object({
  role: z.enum(["ARTIST", "BOOKER"]),
  step: z.number().min(1),
  data: z.record(z.string(), z.any()),
});

export const artistOnboardingSchema = z.object({
  legalName: z.string().min(2),
  stageName: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.string().min(1),
  city: z.string().min(2),
  state: z.string().min(2),
  serviceableStates: z.array(z.string()).min(1),
  category: z.string().min(2),
  subcategory: z.array(z.string()).min(1),
  genres: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  performanceTypes: z.array(z.string()).min(1),
  yearsExperience: z.number().min(0),
  bio: z.string().min(40).max(500),
  portfolioPhotos: z.array(z.string()).min(3),
  packages: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      price: z.number().min(0),
    }),
  ),
  aadhaarNumber: z.string().min(12),
  panNumber: z.string().min(10),
  bankAccountNumber: z.string().min(8),
  confirmBankAccountNumber: z.string().min(8),
  bankIFSC: z.string().min(5),
  bankAccountName: z.string().min(2),
  agreements: z.object({
    artistAgreement: z.boolean(),
    cancellationPolicy: z.boolean(),
    escrowTerms: z.boolean(),
    privacyPolicy: z.boolean(),
  }),
});

export const bookerOnboardingSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  companyName: z.string().optional(),
  bookerType: z.enum(["INDIVIDUAL", "CORPORATE", "PLANNER", "AGENCY"]),
  city: z.string().min(2),
  state: z.string().min(2),
  terms: z.object({
    service: z.boolean(),
    escrow: z.boolean(),
  }),
});

export const cartSchema = z.object({
  artistId: z.string().min(2),
  action: z.enum(["add", "remove"]),
  occasion: z.string().optional(),
  city: z.string().optional(),
});

export const enquirySchema = z.object({
  artistId: z.string().min(2),
  mode: z.enum(["ENQUIRY", "QUICK_BOOKING"]),
  eventName: z.string().min(2),
  eventType: z.string().min(2),
  eventDate: z.string(),
  isFlexibleDate: z.boolean().default(false),
  alternateDates: z.array(z.string()).default([]),
  eventStartTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  venueType: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  eventCity: z.string().min(2),
  eventState: z.string().optional(),
  audienceSize: z.number().min(10),
  duration: z.number().min(30),
  performanceType: z.string().optional(),
  languagePref: z.array(z.string()).default([]),
  specialRequests: z.string().optional(),
  soundAvailable: z.boolean().default(false),
  lightAvailable: z.boolean().default(false),
  travelArranged: z.boolean().default(false),
  accomProvided: z.boolean().default(false),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  contactPerson: z.string().min(2),
  contactPhone: phoneSchema,
  responseUrgency: z.string().optional(),
  moodboardUrl: z.string().optional(),
  quickBookPackage: z.string().optional(),
  quotedPrice: z.number().optional(),
});

export const paymentSchema = z.object({
  paymentMethod: z.enum(["UPI", "CARDS", "NETBANKING", "WALLET"]),
});

export const bookingUpdateSchema = z.object({
  action: z.enum([
    "accept_quote",
    "artist_accept",
    "artist_decline",
    "send_quote",
    "raise_dispute",
    "mark_completed",
    "release_payout",
    "cancel_by_booker",
  ]),
  quotedPrice: z.number().optional(),
  message: z.string().optional(),
  reason: z.string().optional(),
});
