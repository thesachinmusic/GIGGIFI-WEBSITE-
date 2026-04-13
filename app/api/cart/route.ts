import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { readDb, updateDb } from "@/lib/server-db";
import { cartSchema } from "@/lib/validations";

export async function GET() {
  const session = getSessionFromCookies();
  if (!session || session.role !== "BOOKER") {
    return NextResponse.json({ cart: null });
  }
  const db = await readDb();
  const bookerProfile = db.bookers.find((item) => item.userId === session.userId);
  const cart = bookerProfile
    ? db.carts.find((item) => item.bookerId === bookerProfile.id) ?? null
    : null;
  return NextResponse.json({ cart });
}

export async function POST(request: Request) {
  const session = getSessionFromCookies();
  if (!session || session.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker first." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart update." }, { status: 400 });
  }

  const db = await readDb();
  const bookerProfile = db.bookers.find((item) => item.userId === session.userId);
  if (!bookerProfile) {
    return NextResponse.json({ error: "Booker profile missing." }, { status: 404 });
  }

  let responseCart = null;
  await updateDb((next) => {
    let cart = next.carts.find((item) => item.bookerId === bookerProfile.id);
    if (!cart) {
      cart = {
        bookerId: bookerProfile.id,
        artistIds: [],
        updatedAt: new Date().toISOString(),
      };
      next.carts.push(cart);
    }

    if (parsed.data.action === "add" && !cart.artistIds.includes(parsed.data.artistId)) {
      cart.artistIds.push(parsed.data.artistId);
    }

    if (parsed.data.action === "remove") {
      cart.artistIds = cart.artistIds.filter((item) => item !== parsed.data.artistId);
    }

    cart.occasion = parsed.data.occasion ?? cart.occasion;
    cart.city = parsed.data.city ?? cart.city;
    cart.updatedAt = new Date().toISOString();
    responseCart = cart;
  });

  return NextResponse.json({ success: true, cart: responseCart });
}
