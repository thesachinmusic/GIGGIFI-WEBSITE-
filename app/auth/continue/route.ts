import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { resolveAuthenticatedAppPath } from "@/lib/auth-routing";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", url);
    if (nextPath) {
      loginUrl.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  const redirectPath = resolveAuthenticatedAppPath(
    {
      role: session.user.role ?? null,
      phone: session.user.phone ?? null,
      email: session.user.email ?? null,
      onboardingState:
        (session.user.onboardingState as
          | "ROLE_SELECTION"
          | "PROFILE_IN_PROGRESS"
          | "COMPLETE"
          | null
          | undefined) ?? null,
      onboardingDraftRole: session.user.onboardingDraftRole ?? null,
      hasArtistProfile: session.user.hasArtistProfile,
      hasBookerProfile: session.user.hasBookerProfile,
    },
    nextPath,
  );

  return NextResponse.redirect(new URL(redirectPath, url));
}
