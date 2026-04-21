import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hasRequiredContactDetails, resolveAuthenticatedAppPath } from "@/lib/auth-routing";
import { getServerAuthSession } from "@/lib/auth";
import { isOtpTestingBypassEnabled, verifyOtpChallenge } from "@/lib/otp";
import { verifyAndSaveUserPhone } from "@/lib/services/auth-user-service";
import { phoneSchema, verifyOtpSchema } from "@/lib/validations";

function buildRedirect(user: Awaited<ReturnType<typeof verifyAndSaveUserPhone>>, nextPath: string | null) {
  return resolveAuthenticatedAppPath({
    role: user.role,
    phone: user.phone,
    email: user.email,
    onboardingState: user.onboardingState,
    onboardingDraftRole: user.onboardingDraft?.role ?? null,
    hasArtistProfile: Boolean(user.artistProfile),
    hasBookerProfile: Boolean(user.bookerProfile),
  }, nextPath);
}

function mapVerifyPhoneError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2025")
  ) {
    return "We found an existing GiggiFi account for this phone. Please continue with that account or sign in again.";
  }

  if (error instanceof Error && /unique constraint/i.test(error.message)) {
    return "This phone number is already linked to a GiggiFi account. Please continue with that account.";
  }

  return error instanceof Error ? error.message : "Could not verify this phone number.";
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const nextPath = typeof body?.nextPath === "string" ? body.nextPath : null;
  const useTestBypass = body?.useTestBypass === true;

  if (useTestBypass) {
    if (!isOtpTestingBypassEnabled()) {
      return NextResponse.json(
        { error: "Test mode phone bypass is not enabled on this environment." },
        { status: 403 },
      );
    }

    const parsedPhone = phoneSchema.safeParse(body?.phone);
    if (!parsedPhone.success) {
      return NextResponse.json(
        { error: parsedPhone.error.issues[0]?.message ?? "Invalid phone number." },
        { status: 400 },
      );
    }

    try {
      // Dev-only fallback for Twilio trial accounts that cannot send to public numbers.
      const user = await verifyAndSaveUserPhone({
        userId: session.user.id,
        phone: parsedPhone.data,
      });

      return NextResponse.json({
        success: true,
        bypass: true,
        user,
        complete: hasRequiredContactDetails(user),
        redirect: buildRedirect(user, nextPath),
      });
    } catch (error) {
      return NextResponse.json({ error: mapVerifyPhoneError(error) }, { status: 400 });
    }
  }

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
      redirect: buildRedirect(user, nextPath),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: mapVerifyPhoneError(error),
      },
      { status: 400 },
    );
  }
}
