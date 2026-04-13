import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { getViewerData } from "@/lib/server-db";

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  const viewer = await getViewerData({ userId: session.userId, role: session.role });
  return NextResponse.json({
    session,
    user: viewer.user,
    bookerProfile: viewer.bookerProfile,
    artistProfile: viewer.artistProfile,
  });
}
