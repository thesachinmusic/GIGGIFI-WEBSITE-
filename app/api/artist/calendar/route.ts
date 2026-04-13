import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { updateDb } from "@/lib/server-db";

export async function PATCH(request: Request) {
  const session = getSessionFromCookies();
  if (!session || session.role !== "ARTIST") {
    return NextResponse.json({ error: "Artist login required." }, { status: 401 });
  }

  const { date } = (await request.json()) as { date?: string };
  if (!date) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  await updateDb((db) => {
    const artist = db.artists.find((item) => item.userId === session.userId);
    if (!artist) return;
    const exists = artist.blackoutDates.some(
      (item) => new Date(item).toDateString() === new Date(date).toDateString(),
    );
    artist.blackoutDates = exists
      ? artist.blackoutDates.filter(
          (item) => new Date(item).toDateString() !== new Date(date).toDateString(),
        )
      : [...artist.blackoutDates, date];
  });

  return NextResponse.json({ success: true });
}
