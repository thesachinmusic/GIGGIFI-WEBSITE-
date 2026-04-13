import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __giggifiPrisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/giggifi";

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
  });
}

export const prisma = globalThis.__giggifiPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__giggifiPrisma = prisma;
}
