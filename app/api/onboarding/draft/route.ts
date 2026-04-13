import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnboardingDraft, saveOnboardingDraft } from "@/lib/services/profile-service";
import { onboardingDraftSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ draft: null });
  }

  const draft = await getOnboardingDraft(session.user.id);
  return NextResponse.json({
    draft,
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Could not save draft." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingState: "PROFILE_IN_PROGRESS",
    },
  });

  await saveOnboardingDraft(user.id, parsed.data);

  return NextResponse.json({ success: true });
}
