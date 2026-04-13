import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/mock-data";

export const SESSION_COOKIE = "giggifi_session";
export const PENDING_PHONE_COOKIE = "giggifi_pending_phone";

export interface SessionPayload {
  userId: string;
  role: Role;
  phone: string;
  name: string;
}

function encode(value: SessionPayload) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return decode(request.cookies.get(SESSION_COOKIE)?.value);
}

export function getSessionFromCookies() {
  return decode(cookies().get(SESSION_COOKIE)?.value);
}

export function getPendingPhoneFromCookies() {
  return cookies().get(PENDING_PHONE_COOKIE)?.value ?? null;
}

export function applySession(response: NextResponse, payload: SessionPayload) {
  response.cookies.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function applyPendingPhone(response: NextResponse, phone: string) {
  response.cookies.set(PENDING_PHONE_COOKIE, phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 30,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
}

export function clearPendingPhone(response: NextResponse) {
  response.cookies.set(PENDING_PHONE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
}
