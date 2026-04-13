import { NextResponse } from "next/server";
import { applyPendingPhone, applySession } from "@/lib/session";
import { readDb, updateDb } from "@/lib/server-db";
import { buildDashboardPath } from "@/lib/mock-data";
import { verifyOtpSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { error: firstFieldError ?? "Invalid OTP input." },
      { status: 400 },
    );
  }

  const db = await readDb();
  const otpRequest = db.otpRequests.find((item) => item.phone === parsed.data.phone);

  if (!otpRequest || otpRequest.otp !== parsed.data.otp) {
    return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });
  }

  if (new Date(otpRequest.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "OTP expired. Please resend." }, { status: 400 });
  }

  const existingUser = db.users.find((item) => item.phone === parsed.data.phone);
  const response = NextResponse.json(
    existingUser
      ? {
          success: true,
          existingUser: true,
          redirect: buildDashboardPath(existingUser.role),
          role: existingUser.role,
        }
      : {
          success: true,
          existingUser: false,
          redirect: "/onboarding/choice",
        },
  );

  if (existingUser) {
    applySession(response, {
      userId: existingUser.id,
      role: existingUser.role,
      phone: existingUser.phone,
      name: existingUser.name,
    });
  } else {
    applyPendingPhone(response, parsed.data.phone);
  }

  await updateDb((next) => {
    next.otpRequests = next.otpRequests.filter((item) => item.phone !== parsed.data.phone);
  });

  return response;
}
