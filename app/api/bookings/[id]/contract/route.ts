import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { bookingStatusLabels, formatINR } from "@/lib/mock-data";
import { getAuthorizedBooking } from "@/lib/services/booking-service";

interface Context {
  params: { id: string };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function line(label: string, value: string) {
  return `
    <div class="row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `;
}

export async function GET(_request: Request, context: Context) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let result;
  try {
    result = await getAuthorizedBooking(context.params.id, session.user.id);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "FORBIDDEN"
            ? "Forbidden."
            : "Booking not found.",
      },
      { status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 404 },
    );
  }

  const booking = result.booking;
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const artist = booking.artist;
  const booker = booking.booker;
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>GiggiFi Contract ${escapeHtml(booking.id)}</title>
      <style>
        :root {
          color-scheme: light;
          --ink: #181024;
          --muted: #6b7280;
          --line: #e5e7eb;
          --accent: #f4b940;
          --paper: #fffdfa;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: linear-gradient(135deg, #f8f1de, #fffdfa 48%, #f5ead4);
          color: var(--ink);
          font-family: "Georgia", "Times New Roman", serif;
        }
        .sheet {
          max-width: 920px;
          margin: 40px auto;
          background: var(--paper);
          border: 1px solid rgba(24, 16, 36, 0.08);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 24px 80px rgba(24, 16, 36, 0.12);
        }
        .eyebrow {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(244, 185, 64, 0.18);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        h1 {
          margin: 18px 0 8px;
          font-size: 38px;
          line-height: 1.05;
        }
        .subtitle {
          margin: 0 0 28px;
          color: var(--muted);
          font-size: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-top: 28px;
        }
        .card {
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 20px;
          background: white;
        }
        .card h2 {
          margin: 0 0 16px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
        }
        .row {
          padding: 10px 0;
          border-top: 1px solid var(--line);
        }
        .row:first-of-type { border-top: 0; padding-top: 0; }
        .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .value {
          font-size: 16px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 28px;
          border-top: 1px solid var(--line);
          padding-top: 20px;
          color: var(--muted);
          line-height: 1.6;
        }
        @media print {
          body { background: white; }
          .sheet {
            margin: 0;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            max-width: none;
          }
        }
        @media (max-width: 720px) {
          .sheet {
            margin: 0;
            border-radius: 0;
            padding: 24px;
          }
          .grid { grid-template-columns: 1fr; }
          h1 { font-size: 30px; }
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <div class="eyebrow">GiggiFi Contract</div>
        <h1>Booking Agreement</h1>
        <p class="subtitle">This contract view is generated from the live booking data and is safe to print or save as PDF from the browser.</p>

        <section class="grid">
          <article class="card">
            <h2>Booking</h2>
            ${line("Booking ID", booking.id)}
            ${line("Status", bookingStatusLabels[booking.status])}
            ${line("Booking Type", booking.bookingType.replaceAll("_", " "))}
          </article>

          <article class="card">
            <h2>Parties</h2>
            ${line("Artist", artist.stageName)}
            ${line("Booker", booker.fullName)}
            ${line("Artist City", artist.city)}
          </article>

          <article class="card">
            <h2>Event</h2>
            ${line("Event Name", booking.eventName)}
            ${line("Event Type", booking.eventType)}
            ${line("Date", eventDate)}
            ${line("City", booking.eventCity)}
            ${line("Duration", `${booking.duration} minutes`)}
          </article>

          <article class="card">
            <h2>Fee Breakdown</h2>
            ${line("Artist Fee", formatINR(booking.artistPayout ?? 0))}
            ${line("Platform Fee", formatINR(booking.platformFee ?? 0))}
            ${line("GST", formatINR(booking.gstAmount ?? 0))}
            ${line("Total Payable", formatINR(booking.totalAmount ?? 0))}
          </article>
        </section>

        <section class="footer">
          <p>Payment remains protected in the platform workflow. Funds should only be treated as secured once the booking reaches the confirmed payment-held state in the dashboard.</p>
          <p>This document is intended as a booking summary for operations and recordkeeping. For a downloadable PDF, use your browser’s print dialog and choose “Save as PDF”.</p>
        </section>
      </main>
    </body>
  </html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${booking.id}-contract.html"`,
    },
  });
}
