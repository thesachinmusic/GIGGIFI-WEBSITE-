import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import {
  getAuthorizedBooking,
  transitionBooking,
} from "@/lib/services/booking-service";
import { bookingUpdateSchema } from "@/lib/validations";

interface Context {
  params: { id: string };
}

export async function GET(_request: Request, context: Context) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  try {
    const result = await getAuthorizedBooking(context.params.id, session.user.id);

    if (!result.booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking: result.booking });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden." : "Booking not found." },
      { status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 404 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const parsed = bookingUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const booking = await transitionBooking(context.params.id, session.user.id, parsed.data);
    return NextResponse.json({ success: true, status: booking.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update booking.";
    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "Booking not found."
          ? 404
          : 400;
    return NextResponse.json({ error: message === "FORBIDDEN" ? "Forbidden." : message }, { status });
  }
}
