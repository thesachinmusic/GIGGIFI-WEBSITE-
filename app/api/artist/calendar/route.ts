import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "ARTIST") {
    return NextResponse.json({ error: "Artist login required." }, { status: 401 });
  }

  const { date } = (await request.json()) as { date?: string };
  if (!date) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artist profile missing." }, { status: 404 });
  }

  const targetDate = new Date(date);
  const exists = artist.blackoutDates.some(
    (item) => item.toDateString() === targetDate.toDateString(),
  );

  await prisma.artistProfile.update({
    where: { id: artist.id },
    data: {
      blackoutDates: exists
        ? artist.blackoutDates.filter((item) => item.toDateString() !== targetDate.toDateString())
        : [...artist.blackoutDates, targetDate],
    },
  });

  return NextResponse.json({ success: true });
}
