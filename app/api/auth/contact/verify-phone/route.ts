import { NextResponse } from "next/server";
import { hasRequiredContactDetails, resolveAuthenticatedAppPath } from "@/lib/auth-routing";
import { getServerAuthSession } from "@/lib/auth";
import { verifyOtpChallenge } from "@/lib/otp";
import { verifyAndSaveUserPhone } from "@/lib/services/auth-user-service";
import { verifyOtpSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

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
    await verifyOtpChallenge(parsed.data.phone, parsed.data.otp, true);
    const user = await verifyAndSaveUserPhone({
      userId: session.user.id,
      phone: parsed.data.phone,
    });

    return NextResponse.json({
      success: true,
      user,
      complete: hasRequiredContactDetails(user),
      redirect: resolveAuthenticatedAppPath({
        role: user.role,
        phone: user.phone,
        email: user.email,
        onboardingState: user.onboardingState,
        onboardingDraftRole: user.onboardingDraft?.role ?? null,
        hasArtistProfile: Boolean(user.artistProfile),
        hasBookerProfile: Boolean(user.bookerProfile),
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not verify this phone number.",
      },
      { status: 400 },
    );
  }
}
