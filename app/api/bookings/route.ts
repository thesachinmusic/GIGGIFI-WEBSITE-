import { NextResponse } from "next/server";
import { calculatePricing } from "@/lib/mock-data";
import { createNotification, makeId, readDb, updateDb } from "@/lib/server-db";
import { getSessionFromCookies } from "@/lib/session";
import { enquirySchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = getSessionFromCookies();
  if (!session || session.role !== "BOOKER") {
    return NextResponse.json({ error: "Login as a booker to proceed." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  const db = await readDb();
  const booker = db.bookers.find((item) => item.userId === session.userId);
  const artist = db.artists.find((item) => item.id === parsed.data.artistId);

  if (!booker || !artist) {
    return NextResponse.json({ error: "Could not find booker or artist." }, { status: 404 });
  }

  const blocked = artist.blackoutDates.some(
    (date) => new Date(date).toDateString() === new Date(parsed.data.eventDate).toDateString(),
  );
  if (blocked) {
    return NextResponse.json(
      {
        error:
          "Date unavailable. Please submit an enquiry for alternate dates instead.",
      },
      { status: 400 },
    );
  }

  const quoteSource =
    parsed.data.quotedPrice ??
    artist.packages.find((pkg) => pkg.title === parsed.data.quickBookPackage)?.price ??
    artist.basePriceSolo;
  const pricing = calculatePricing(quoteSource);

  const bookingId = makeId("booking");
  await updateDb((next) => {
    next.bookings.unshift({
      id: bookingId,
      bookerId: booker.id,
      artistId: artist.id,
      bookingType: parsed.data.mode,
      status: parsed.data.mode === "QUICK_BOOKING" ? "AWAITING_PAYMENT" : "ENQUIRY_SENT",
      eventName: parsed.data.eventName,
      eventType: parsed.data.eventType,
      eventDate: parsed.data.eventDate,
      isFlexibleDate: parsed.data.isFlexibleDate,
      alternateDates: parsed.data.alternateDates,
      eventStartTime: parsed.data.eventStartTime,
      eventEndTime: parsed.data.eventEndTime,
      venueType: parsed.data.venueType,
      venueName: parsed.data.venueName,
      venueAddress: parsed.data.venueAddress,
      eventCity: parsed.data.eventCity,
      eventState: parsed.data.eventState,
      audienceSize: parsed.data.audienceSize,
      duration: parsed.data.duration,
      performanceType: parsed.data.performanceType,
      languagePref: parsed.data.languagePref,
      specialRequests: parsed.data.specialRequests,
      soundAvailable: parsed.data.soundAvailable,
      lightAvailable: parsed.data.lightAvailable,
      travelArranged: parsed.data.travelArranged,
      accomProvided: parsed.data.accomProvided,
      budgetMin: parsed.data.budgetMin,
      budgetMax: parsed.data.budgetMax,
      contactPerson: parsed.data.contactPerson,
      contactPhone: parsed.data.contactPhone,
      responseUrgency: parsed.data.responseUrgency,
      moodboardUrl: parsed.data.moodboardUrl,
      quotedPrice: pricing.artistFee,
      totalAmount: pricing.total,
      platformFee: pricing.platformFee,
      gstAmount: pricing.gstAmount,
      artistPayout: pricing.artistPayout,
      escrowStatus: "NOT_INITIATED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quickBookPackage: parsed.data.quickBookPackage,
      chat: [
        {
          id: makeId("chat"),
          from: "BOOKER",
          body:
            parsed.data.mode === "QUICK_BOOKING"
              ? "Quick booking request submitted."
              : "Enquiry sent.",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  if (artist.userId) {
    await createNotification({
      userId: artist.userId,
      title: "New enquiry received",
      body: `New enquiry from ${booker.fullName} for ${parsed.data.eventType} on ${new Date(parsed.data.eventDate).toLocaleDateString("en-IN")}.`,
      type: "ENQUIRY_RECEIVED",
      actionUrl: "/artist/enquiries",
    });
  }

  return NextResponse.json({
    success: true,
    bookingId,
    redirect:
      parsed.data.mode === "QUICK_BOOKING"
        ? `/checkout/${bookingId}`
        : `/booking/${bookingId}`,
  });
}
