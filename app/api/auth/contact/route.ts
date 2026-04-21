import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { hasRequiredContactDetails, resolveAuthenticatedAppPath } from "@/lib/auth-routing";
import { getServerAuthSession } from "@/lib/auth";
import { saveUserEmailContact } from "@/lib/services/auth-user-service";
import { completeContactSchema } from "@/lib/validations";

function mapContactEmailError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2025")
  ) {
    return "We found an existing GiggiFi account for this email. Please continue with that account or sign in again.";
  }

  if (error instanceof Error && /unique constraint/i.test(error.message)) {
    return "This email is already linked to a GiggiFi account. Please continue with that account.";
  }

  return error instanceof Error ? error.message : "We could not save your email right now.";
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const nextPath = typeof body?.nextPath === "string" ? body.nextPath : null;
  const parsed = completeContactSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { error: firstFieldError ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const user = await saveUserEmailContact({
      userId: session.user.id,
      email: parsed.data.email,
      name: parsed.data.name ?? session.user.name ?? undefined,
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
      }, nextPath),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: mapContactEmailError(error),
      },
      { status: 400 },
    );
  }
}
