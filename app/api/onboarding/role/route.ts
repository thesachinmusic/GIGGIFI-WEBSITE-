import { NextResponse } from "next/server";
import {
  hasRequiredContactDetails,
  resolveRoleSelectionRedirect,
} from "@/lib/auth-routing";
import { getServerAuthSession } from "@/lib/auth";
import { getAuthSessionUser, setSelectedUserRole } from "@/lib/services/auth-user-service";
import { selectRoleSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const nextPath = typeof body?.nextPath === "string" ? body.nextPath : null;
  const parsed = selectRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
  }

  const currentUser = await getAuthSessionUser(session.user.id);
  if (!currentUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!hasRequiredContactDetails(currentUser)) {
    return NextResponse.json(
      {
        error: "Complete your phone number and email before choosing a role.",
      },
      { status: 400 },
    );
  }

  try {
    const user = await setSelectedUserRole({
      userId: session.user.id,
      role: parsed.data.role,
    });

    return NextResponse.json({
      success: true,
      redirect: resolveRoleSelectionRedirect(parsed.data.role, {
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
        error:
          error instanceof Error
            ? error.message
            : "We could not continue with that role right now.",
      },
      { status: 400 },
    );
  }
}
