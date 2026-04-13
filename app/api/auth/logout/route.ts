import { NextResponse } from "next/server";
import { clearPendingPhone, clearSession } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSession(response);
  clearPendingPhone(response);
  return response;
}
