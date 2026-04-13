import { NextResponse } from "next/server";
import { buildDashboardPath, hasCompletedRoleProfile } from "@/lib/auth-routing";
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
        role: true,
        artistProfile: { select: { id: true } },
        bookerProfile: { select: { id: true } },
      },
    });

    const redirect =
      existingUser &&
      hasCompletedRoleProfile({
        role: existingUser.role,
        hasArtistProfile: Boolean(existingUser.artistProfile),
        hasBookerProfile: Boolean(existingUser.bookerProfile),
      })
        ? buildDashboardPath(existingUser.role)
        : "/onboarding/choice";

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
