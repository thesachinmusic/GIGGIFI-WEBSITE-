import "server-only";

import crypto from "crypto";
import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone } from "@/lib/validations";

const OTP_TTL_MS = 5 * 60 * 1000;
type OtpProvider = "preview" | "twilio";

function otpSecret() {
  return process.env.NEXTAUTH_SECRET ?? "giggifi-dev-otp-secret";
}

function hashOtp(phone: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${phone}:${otp}:${otpSecret()}`)
    .digest("hex");
}

function createOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error(
      "OTP login is not configured yet. Add Twilio Verify credentials or use Google login.",
    );
  }

  if (!/^AC[a-zA-Z0-9]{32}$/.test(accountSid)) {
    throw new Error(
      "OTP login is not configured correctly yet. TWILIO_ACCOUNT_SID must start with AC.",
    );
  }

  if (!/^VA[a-zA-Z0-9]{32}$/.test(verifyServiceSid)) {
    throw new Error(
      "OTP login is not configured correctly yet. TWILIO_VERIFY_SERVICE_SID must start with VA.",
    );
  }

  return {
    accountSid,
    authToken,
    verifyServiceSid,
  };
}

function isPreviewOtpMode() {
  return !isTwilioOtpEnabled() && shouldRevealOtpPreview();
}

function mapTwilioError(error: unknown) {
  const message = error instanceof Error ? error.message : "Twilio Verify request failed.";
  const code =
    typeof error === "object" && error !== null && "code" in error ? Number((error as { code?: unknown }).code) : null;

  if (message.includes("Custom code not allowed")) {
    return new Error("OTP delivery is being updated. Please request a fresh OTP and try again.");
  }

  if (message.includes("Trial accounts cannot send messages to unverified numbers")) {
    return new Error(
      "This Twilio trial account can only send OTPs to verified phone numbers. Verify the number in Twilio or upgrade the account for public OTP login.",
    );
  }

  if (code === 20404) {
    return new Error("Twilio Verify service not found. Check TWILIO_VERIFY_SERVICE_SID.");
  }

  if (code === 20003) {
    return new Error("Twilio credentials are invalid. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }

  return new Error(message);
}

export function isTwilioTrialRestrictionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Trial accounts cannot send messages to unverified numbers");
}

async function sendViaTwilio(phone: string) {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();
  const client = Twilio(accountSid, authToken);

  await client.verify.v2.services(verifyServiceSid).verifications.create({
    to: phone,
    channel: "sms",
  });

  return { provider: "twilio" as const };
}

async function verifyViaTwilio(phone: string, otp: string) {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();
  const client = Twilio(accountSid, authToken);

  return client.verify.v2.services(verifyServiceSid).verificationChecks.create({
    to: phone,
    code: otp,
  });
}

async function recordFailedAttempt(phone: string) {
  await prisma.otpChallenge.update({
    where: { phone },
    data: {
      attempts: { increment: 1 },
      lastTriedAt: new Date(),
    },
  });
}

export function shouldRevealOtpPreview() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_OTP_PREVIEW === "true";
}

export function isOtpTestingBypassEnabled() {
  // Dev-only escape hatch for Twilio trial limitations. Keep disabled in production.
  return process.env.TWILIO_BYPASS_FOR_TESTING === "true";
}

export function isTwilioOtpEnabled() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

export function getOtpMode() {
  if (isTwilioOtpEnabled()) {
    return "twilio" as const;
  }

  if (isPreviewOtpMode()) {
    return "preview" as const;
  }

  return "unavailable" as const;
}

export async function issueOtpChallenge(rawPhone: string, userId?: string) {
  const phone = normalizeIndianPhone(rawPhone);
  const previewMode = isPreviewOtpMode();
  const otp = previewMode ? createOtp() : null;
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.upsert({
    where: { phone },
    update: {
      userId,
      codeHash: otp ? hashOtp(phone, otp) : "twilio-managed",
      expiresAt,
      attempts: 0,
      consumedAt: null,
      requestedAt: new Date(),
      lastTriedAt: null,
    },
    create: {
      phone,
      userId,
      codeHash: otp ? hashOtp(phone, otp) : "twilio-managed",
      expiresAt,
    },
  });

  let provider: OtpProvider = "preview";

  if (!previewMode) {
    try {
      await sendViaTwilio(phone);
      provider = "twilio";
    } catch (error) {
      throw mapTwilioError(error);
    }
  }

  return {
    phone,
    expiresAt,
    provider,
    previewOtp: previewMode ? otp ?? undefined : undefined,
  };
}

export async function verifyOtpChallenge(rawPhone: string, otp: string, consume = true) {
  const phone = normalizeIndianPhone(rawPhone);
  const challenge = await prisma.otpChallenge.findUnique({
    where: { phone },
  });

  if (!challenge) {
    throw new Error("Incorrect OTP.");
  }

  if (challenge.consumedAt) {
    throw new Error("OTP already used. Please resend.");
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new Error("OTP expired. Please resend.");
  }

  if (isTwilioOtpEnabled()) {
    try {
      const result = await verifyViaTwilio(phone, otp);

      if (result.status !== "approved") {
        await recordFailedAttempt(phone);
        throw new Error(
          result.status === "canceled" ? "OTP expired. Please resend." : "Incorrect OTP.",
        );
      }
    } catch (error) {
      const mappedError = mapTwilioError(error);
      const shouldRecordAttempt = !mappedError.message.includes("Twilio");
      if (shouldRecordAttempt) {
        await recordFailedAttempt(phone);
      }
      throw mappedError;
    }
  } else {
    if (challenge.codeHash !== hashOtp(phone, otp)) {
      await recordFailedAttempt(phone);
      throw new Error("Incorrect OTP.");
    }
  }

  const consumedAt = consume ? new Date() : null;
  await prisma.otpChallenge.update({
    where: { phone },
    data: {
      consumedAt,
      lastTriedAt: new Date(),
    },
  });

  return challenge;
}
