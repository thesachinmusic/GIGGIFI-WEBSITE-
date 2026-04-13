import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest, SESSION_COOKIE } from "@/lib/session";

const protectedRolePrefixes: Array<{ prefix: string; role: "ARTIST" | "BOOKER" | "ADMIN" }> = [
  { prefix: "/artist", role: "ARTIST" },
  { prefix: "/booker", role: "BOOKER" },
  { prefix: "/checkout", role: "BOOKER" },
  { prefix: "/cart", role: "BOOKER" },
  { prefix: "/payment", role: "BOOKER" },
  { prefix: "/admin", role: "ADMIN" },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = getSessionFromRequest(request);

  for (const item of protectedRolePrefixes) {
    if (pathname.startsWith(item.prefix)) {
      if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (session.role !== item.role) {
        const url =
          session.role === "ARTIST"
            ? new URL("/artist/dashboard", request.url)
            : session.role === "BOOKER"
              ? new URL("/booker/dashboard", request.url)
              : new URL("/admin", request.url);
        return NextResponse.redirect(url);
      }
    }
  }

  if (pathname.startsWith("/onboarding") && session) {
    const redirectUrl =
      session.role === "ARTIST"
        ? "/artist/dashboard"
        : session.role === "BOOKER"
          ? "/booker/dashboard"
          : "/admin";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
