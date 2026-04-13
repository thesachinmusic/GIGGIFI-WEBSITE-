import "server-only";

import { KYCStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notification-service";

export async function reviewArtistKyc(input: {
  actorUserId: string;
  artistId: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
}) {
  const admin = await prisma.user.findUnique({
    where: { id: input.actorUserId },
    select: { role: true },
  });

  if (admin?.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN");
  }

  const artist = await prisma.artistProfile.update({
    where: { id: input.artistId },
    data: {
      kycStatus: input.status === "APPROVED" ? KYCStatus.APPROVED : KYCStatus.REJECTED,
    },
  });

  await createNotification({
    userId: artist.userId,
    title: input.status === "APPROVED" ? "KYC approved" : "KYC rejected",
    body:
      input.status === "APPROVED"
        ? "Your KYC review is complete. You can continue operating normally."
        : input.reason ?? "Your KYC submission needs attention. Please review and resubmit.",
    type: "KYC_REVIEW",
    actionUrl: "/artist/dashboard",
  });

  return artist;
}
