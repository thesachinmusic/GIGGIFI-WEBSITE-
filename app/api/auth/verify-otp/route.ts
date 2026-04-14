import { NextResponse } from "next/server";
import { resolveAuthenticatedAppPath } from "@/lib/auth-routing";
import { verifyOtpChallenge } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
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

  try {
    await verifyOtpChallenge(parsed.data.phone, parsed.data.otp, false);
    const existingUser = await prisma.user.findUnique({
      where: { phone: parsed.data.phone },
      select: {
        email: true,
        role: true,
        onboardingState: true,
        artistProfile: { select: { id: true } },
        bookerProfile: { select: { id: true } },
        onboardingDraft: { select: { role: true } },
      },
    });

    const redirect = existingUser
      ? resolveAuthenticatedAppPath({
          role: existingUser.role,
          phone: parsed.data.phone,
          email: existingUser.email,
          onboardingState: existingUser.onboardingState,
          onboardingDraftRole: existingUser.onboardingDraft?.role ?? null,
          hasArtistProfile: Boolean(existingUser.artistProfile),
          hasBookerProfile: Boolean(existingUser.bookerProfile),
        })
      : "/onboarding/contact?missing=email";

    return NextResponse.json({
      success: true,
      existingUser: Boolean(existingUser),
      redirect,
      role: existingUser?.role ?? null,
      signInProvider: "phone-otp",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not verify OTP.",
      },
      { status: 400 },
    );
  }
}
