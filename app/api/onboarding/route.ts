import { NextResponse } from "next/server";
import { buildDashboardPath, hasRequiredContactDetails } from "@/lib/auth-routing";
import { getServerAuthSession } from "@/lib/auth";
import { getAuthSessionUser } from "@/lib/services/auth-user-service";
import {
  completeArtistOnboarding,
  completeBookerOnboarding,
} from "@/lib/services/profile-service";
import {
  artistOnboardingSchema,
  bookerOnboardingSchema,
} from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required before onboarding." }, { status: 401 });
  }

  const currentUser = await getAuthSessionUser(session.user.id);
  if (!currentUser || !hasRequiredContactDetails(currentUser)) {
    return NextResponse.json(
      { error: "Complete your phone number and email before role onboarding." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const role = body.role as "ARTIST" | "BOOKER";

  if (role === "ARTIST") {
    const parsed = artistOnboardingSchema.safeParse(body.payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
      return NextResponse.json(
        { error: firstFieldError ?? "Please complete all artist steps." },
        { status: 400 },
      );
    }
    const result = await completeArtistOnboarding(session.user.id, {
      ...body.payload,
      ...parsed.data,
    });

    return NextResponse.json({
      success: true,
      redirect: buildDashboardPath("ARTIST"),
      artistId: result.artist.id,
      profilePath: `/booker/artist/${result.artist.id}`,
    });
  }

  const parsed = bookerOnboardingSchema.safeParse(body.payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
    return NextResponse.json(
      { error: firstFieldError ?? "Please complete all booker steps." },
      { status: 400 },
    );
  }

  await completeBookerOnboarding(session.user.id, {
    ...body.payload,
    ...parsed.data,
  });

  return NextResponse.json({
    success: true,
    redirect: buildDashboardPath("BOOKER"),
  });
}
