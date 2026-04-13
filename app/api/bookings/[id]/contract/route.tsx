import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { bookingStatusLabels, formatINR } from "@/lib/mock-data";
import { readDb } from "@/lib/server-db";

interface Context {
  params: { id: string };
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, color: "#181024" },
  title: { fontSize: 24, marginBottom: 8, fontWeight: 700 },
  subtitle: { color: "#6b7280", marginBottom: 24 },
  section: { marginBottom: 16 },
  label: { fontSize: 10, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" },
  value: { fontSize: 12 },
  row: { display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
});

export async function GET(_request: Request, context: Context) {
  const db = await readDb();
  const booking = db.bookings.find((item) => item.id === context.params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  const artist = db.artists.find((item) => item.id === booking.artistId);
  const booker = db.bookers.find((item) => item.id === booking.bookerId);

  const buffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>GiggiFi Booking Contract</Text>
        <Text style={styles.subtitle}>Where real talent meets real opportunities</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Booking</Text>
          <Text style={styles.value}>ID: {booking.id}</Text>
          <Text style={styles.value}>Status: {bookingStatusLabels[booking.status]}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Parties</Text>
          <Text style={styles.value}>Artist: {artist?.stageName ?? "Artist"}</Text>
          <Text style={styles.value}>Booker: {booker?.fullName ?? "Booker"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Event</Text>
          <Text style={styles.value}>{booking.eventName}</Text>
          <Text style={styles.value}>{new Date(booking.eventDate).toLocaleDateString("en-IN")}</Text>
          <Text style={styles.value}>{booking.eventCity}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fee breakdown</Text>
          <View style={styles.row}>
            <Text>Artist fee</Text>
            <Text>{formatINR(booking.artistPayout ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Platform fee</Text>
            <Text>{formatINR(booking.platformFee ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text>GST</Text>
            <Text>{formatINR(booking.gstAmount ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total payable</Text>
            <Text>{formatINR(booking.totalAmount ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Escrow</Text>
          <Text style={styles.value}>
            Your payment is held securely in escrow and released to the artist only after your event is successfully completed.
          </Text>
        </View>
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${booking.id}.pdf"`,
    },
  });
}
