import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import {
  buildContactCompletionPath,
  hasCompletedRoleProfile,
  hasRequiredContactDetails,
  resolveAuthenticatedAppPath,
} from "@/lib/auth-routing";

const protectedRolePrefixes: Array<{ prefix: string; role: "ARTIST" | "BOOKER" | "ADMIN" }> = [
  { prefix: "/artist", role: "ARTIST" },
  { prefix: "/booker", role: "BOOKER" },
  { prefix: "/checkout", role: "BOOKER" },
  { prefix: "/cart", role: "BOOKER" },
  { prefix: "/payment", role: "BOOKER" },
  { prefix: "/admin", role: "ADMIN" },
];

function dashboardForToken(token: JWT | null) {
  return resolveAuthenticatedAppPath({
    role: (token?.role as "ARTIST" | "BOOKER" | "ADMIN" | null | undefined) ?? null,
    phone: (token?.phone as string | null | undefined) ?? null,
    email: (token?.email as string | null | undefined) ?? null,
    onboardingState: (token?.onboardingState as
      | "ROLE_SELECTION"
      | "PROFILE_IN_PROGRESS"
      | "COMPLETE"
      | null
      | undefined) ?? null,
    onboardingDraftRole:
      (token?.onboardingDraftRole as "ARTIST" | "BOOKER" | "ADMIN" | null | undefined) ?? null,
    hasArtistProfile: Boolean(token?.hasArtistProfile),
    hasBookerProfile: Boolean(token?.hasBookerProfile),
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const hasCompletedProfile = hasCompletedRoleProfile({
    role: (token?.role as "ARTIST" | "BOOKER" | "ADMIN" | null | undefined) ?? null,
    hasArtistProfile: Boolean(token?.hasArtistProfile),
    hasBookerProfile: Boolean(token?.hasBookerProfile),
  });
  const hasRequiredContacts = hasRequiredContactDetails({
    phone: (token?.phone as string | null | undefined) ?? null,
    email: (token?.email as string | null | undefined) ?? null,
  });

  for (const item of protectedRolePrefixes) {
    if (!pathname.startsWith(item.prefix)) {
      continue;
    }

    if (!token?.sub) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasRequiredContacts) {
      return NextResponse.redirect(
        new URL(
          buildContactCompletionPath({
            phone: (token?.phone as string | null | undefined) ?? null,
            email: (token?.email as string | null | undefined) ?? null,
          }),
          request.url,
        ),
      );
    }

    if (!hasCompletedProfile && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }

    if (token.role !== item.role) {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }
  }

  if (pathname === "/login" && token?.sub) {
    return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
  }

  if (pathname.startsWith("/onboarding")) {
    if (!token?.sub) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasRequiredContacts) {
      if (pathname === "/onboarding/contact") {
        return NextResponse.next();
      }

      return NextResponse.redirect(
        new URL(
          buildContactCompletionPath({
            phone: (token?.phone as string | null | undefined) ?? null,
            email: (token?.email as string | null | undefined) ?? null,
          }),
          request.url,
        ),
      );
    }

    if (pathname === "/onboarding/contact") {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }

    if (
      (hasCompletedProfile || token.role === "ADMIN") &&
      (pathname === "/onboarding/choice" ||
        pathname === "/onboarding/artist" ||
        pathname === "/onboarding/booker")
    ) {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
