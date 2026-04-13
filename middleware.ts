import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { hasCompletedRoleProfile } from "@/lib/auth-routing";

const protectedRolePrefixes: Array<{ prefix: string; role: "ARTIST" | "BOOKER" | "ADMIN" }> = [
  { prefix: "/artist", role: "ARTIST" },
  { prefix: "/booker", role: "BOOKER" },
  { prefix: "/checkout", role: "BOOKER" },
  { prefix: "/cart", role: "BOOKER" },
  { prefix: "/payment", role: "BOOKER" },
  { prefix: "/admin", role: "ADMIN" },
];

function dashboardForToken(token: JWT | null) {
  if (token?.role === "ARTIST" && token.hasArtistProfile) return "/artist/dashboard";
  if (token?.role === "BOOKER" && token.hasBookerProfile) return "/booker/dashboard";
  if (token?.role === "ADMIN") return "/admin";
  return "/onboarding/choice";
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

  for (const item of protectedRolePrefixes) {
    if (!pathname.startsWith(item.prefix)) {
      continue;
    }

    if (!token?.sub) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasCompletedProfile && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/onboarding/choice", request.url));
    }

    if (token.role !== item.role) {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }
  }

  if (pathname === "/login" && token?.sub) {
    return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
  }

  if (pathname.startsWith("/onboarding") && token?.sub) {
    if (hasCompletedProfile || token.role === "ADMIN") {
      return NextResponse.redirect(new URL(dashboardForToken(token), request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
