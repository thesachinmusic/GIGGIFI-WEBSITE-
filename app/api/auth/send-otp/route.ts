import { NextResponse } from "next/server";
import { generateOtp, updateDb } from "@/lib/server-db";
import { sendOtpSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = sendOtpSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { error: firstFieldError ?? "Invalid phone number." },
      { status: 400 },
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await updateDb((db) => {
    db.otpRequests = db.otpRequests.filter((item) => item.phone !== parsed.data.phone);
    db.otpRequests.push({
      phone: parsed.data.phone,
      otp,
      expiresAt,
    });
  });

  const message = `Your GiggiFi OTP is ${otp}. Valid for 5 minutes.`;
  return NextResponse.json({
    success: true,
    message: "OTP sent",
    previewOtp: otp,
    expiresAt,
    provider: process.env.TWILIO_ACCOUNT_SID ? "twilio" : "mock",
    notificationCopy: message,
  });
}
