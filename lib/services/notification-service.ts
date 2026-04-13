import "server-only";

import { prisma } from "@/lib/prisma";

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  type: string;
  actionUrl?: string;
}) {
  return prisma.notification.create({
    data: input,
  });
}
