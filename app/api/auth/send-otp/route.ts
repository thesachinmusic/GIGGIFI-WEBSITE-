import { NextResponse } from "next/server";
import { issueOtpChallenge } from "@/lib/otp";
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

  const result = await issueOtpChallenge(parsed.data.phone);

  return NextResponse.json({
    success: true,
    message: "OTP sent",
    previewOtp: result.previewOtp,
    expiresAt: result.expiresAt.toISOString(),
    provider: result.provider,
  });
}
