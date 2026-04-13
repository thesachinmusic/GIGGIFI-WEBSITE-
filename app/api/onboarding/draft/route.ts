import { NextResponse } from "next/server";
import { getPendingPhoneFromCookies, getSessionFromCookies } from "@/lib/session";
import { readDb, updateDb } from "@/lib/server-db";
import { onboardingDraftSchema } from "@/lib/validations";

export async function GET() {
  const pendingPhone = getPendingPhoneFromCookies() ?? getSessionFromCookies()?.phone;
  if (!pendingPhone) {
    return NextResponse.json({ draft: null });
  }
  const db = await readDb();
  return NextResponse.json({
    draft: db.onboardingDrafts.find((item) => item.phone === pendingPhone) ?? null,
  });
}

export async function POST(request: Request) {
  const pendingPhone = getPendingPhoneFromCookies() ?? getSessionFromCookies()?.phone;
  if (!pendingPhone) {
    return NextResponse.json({ error: "No verified phone found." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Could not save draft." }, { status: 400 });
  }

  await updateDb((db) => {
    db.onboardingDrafts = db.onboardingDrafts.filter((item) => item.phone !== pendingPhone);
    db.onboardingDrafts.push({
      phone: pendingPhone,
      role: parsed.data.role,
      step: parsed.data.step,
      data: parsed.data.data,
      updatedAt: new Date().toISOString(),
    });
  });

  return NextResponse.json({ success: true });
}
