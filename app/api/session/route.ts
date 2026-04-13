import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ session: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artistProfile: true,
      bookerProfile: true,
    },
  });

  return NextResponse.json({
    session,
    user,
    bookerProfile: user?.bookerProfile ?? null,
    artistProfile: user?.artistProfile ?? null,
  });
}
