import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createBookingForBooker } from "@/lib/services/booking-service";
import { enquirySchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker to proceed." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  try {
    const booking = await createBookingForBooker(session.user.id, parsed.data);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      redirect:
        parsed.data.mode === "QUICK_BOOKING"
          ? `/checkout/${booking.id}`
          : `/booking/${booking.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not create booking.",
      },
      { status: 400 },
    );
  }
}
