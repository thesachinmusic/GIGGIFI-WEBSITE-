import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { reviewArtistKyc } from "@/lib/services/admin-service";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
});

interface Context {
  params: { artistId: string };
}

export async function PATCH(request: Request, context: Context) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid KYC action." }, { status: 400 });
  }

  try {
    const artist = await reviewArtistKyc({
      actorUserId: session.user.id,
      artistId: context.params.artistId,
      status: parsed.data.status,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, artistId: artist.id, kycStatus: artist.kycStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KYC review failed.";
    return NextResponse.json(
      { error: message === "FORBIDDEN" ? "Forbidden." : message },
      { status: message === "FORBIDDEN" ? 403 : 400 },
    );
  }
}
