import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cartSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "BOOKER") {
    return NextResponse.json({ cart: null });
  }

  const bookerProfile = await prisma.bookerProfile.findUnique({
    where: { userId: session.user.id },
    include: { cart: true },
  });

  const cart = bookerProfile?.cart ?? null;

  return NextResponse.json({ cart });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker first." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart update." }, { status: 400 });
  }

  const bookerProfile = await prisma.bookerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!bookerProfile) {
    return NextResponse.json({ error: "Booker profile missing." }, { status: 404 });
  }

  const currentCart = await prisma.cart.findUnique({
    where: { bookerId: bookerProfile.id },
  });

  const nextArtistIds = currentCart?.artistIds ?? [];

  const artistIds =
    parsed.data.action === "add"
      ? Array.from(new Set([...nextArtistIds, parsed.data.artistId]))
      : nextArtistIds.filter((item) => item !== parsed.data.artistId);

  const cart = await prisma.cart.upsert({
    where: { bookerId: bookerProfile.id },
    update: {
      artistIds,
      occasion: parsed.data.occasion ?? currentCart?.occasion,
      city: parsed.data.city ?? currentCart?.city,
    },
    create: {
      bookerId: bookerProfile.id,
      artistIds,
      occasion: parsed.data.occasion,
      city: parsed.data.city,
    },
  });

  return NextResponse.json({ success: true, cart });
}
