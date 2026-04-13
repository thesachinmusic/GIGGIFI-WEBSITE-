import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Use the NextAuth signOut flow instead of the legacy logout endpoint.",
    },
    { status: 410 },
  );
}
