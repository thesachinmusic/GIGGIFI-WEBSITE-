import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import {
  getBookingDraft,
  saveBookingDraft,
} from "@/lib/services/booking-service";

const schema = z.object({
  artistId: z.string().min(2),
  data: z.record(z.string(), z.unknown()),
});

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ draft: null });
  }

  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("artistId");
  if (!artistId) {
    return NextResponse.json({ draft: null });
  }

  const draft = await getBookingDraft(session.user.id, artistId);
  return NextResponse.json({ draft });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
  }

  const draft = await saveBookingDraft(
    session.user.id,
    parsed.data.artistId,
    parsed.data.data,
  );

  return NextResponse.json({ success: true, draft });
}
