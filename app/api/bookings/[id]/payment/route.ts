import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createPendingPayment } from "@/lib/services/booking-service";
import { paymentSchema } from "@/lib/validations";

interface Context {
  params: { id: string };
}

export async function POST(request: Request, context: Context) {
  const session = await getServerAuthSession();
  if (!session?.user?.id || session.user.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker first." }, { status: 401 });
  }

  const parsedBody = paymentSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }

  try {
    const payment = await createPendingPayment(context.params.id, session.user.id, parsedBody.data);
    return NextResponse.json(
      {
        success: true,
        pending: true,
        redirect: `/booking/${context.params.id}`,
        message:
          payment.failureMessage ??
          "Payment provider is not configured yet. Booking remains awaiting payment.",
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create payment.";
    const status =
      message === "This booking is not yours."
        ? 403
        : message === "This booking is not ready for payment."
          ? 400
          : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
