import "server-only";

import crypto from "crypto";
import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { normalizeIndianPhone } from "@/lib/validations";

const OTP_TTL_MS = 5 * 60 * 1000;

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

async function sendViaTwilio(phone: string, otp: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    if (shouldRevealOtpPreview()) {
      return { provider: "mock" as const };
    }

    throw new Error(
      "OTP login is not configured yet. Add Twilio Verify credentials or use Google login.",
    );
  }

  const client = Twilio(accountSid, authToken);

  await client.verify.v2.services(verifyServiceSid).verifications.create({
    to: phone,
    channel: "sms",
    customCode: otp,
  });

  return { provider: "twilio" as const };
}

export function shouldRevealOtpPreview() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_OTP_PREVIEW === "true";
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

  if (shouldRevealOtpPreview()) {
    return "preview" as const;
  }

  return "unavailable" as const;
}

export async function issueOtpChallenge(rawPhone: string, userId?: string) {
  const phone = normalizeIndianPhone(rawPhone);
  const otp = createOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.upsert({
    where: { phone },
    update: {
      userId,
      codeHash: hashOtp(phone, otp),
      expiresAt,
      attempts: 0,
      consumedAt: null,
      requestedAt: new Date(),
      lastTriedAt: null,
    },
    create: {
      phone,
      userId,
      codeHash: hashOtp(phone, otp),
      expiresAt,
    },
  });

  const delivery = await sendViaTwilio(phone, otp);

  return {
    phone,
    expiresAt,
    provider: delivery.provider,
    previewOtp: shouldRevealOtpPreview() ? otp : undefined,
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

  if (challenge.codeHash !== hashOtp(phone, otp)) {
    await prisma.otpChallenge.update({
      where: { phone },
      data: {
        attempts: { increment: 1 },
        lastTriedAt: new Date(),
      },
    });
    throw new Error("Incorrect OTP.");
  }

  if (consume) {
    await prisma.otpChallenge.update({
      where: { phone },
      data: {
        consumedAt: new Date(),
        lastTriedAt: new Date(),
      },
    });
  }

  return challenge;
}
