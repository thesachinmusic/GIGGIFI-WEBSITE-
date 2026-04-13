import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  type MockDatabase,
  type NotificationRecord,
  type Role,
  buildDashboardPath,
  createInitialDatabase,
} from "@/lib/mock-data";

const dbFile = path.join(process.cwd(), "data", "mock-db.json");

async function ensureDb() {
  await mkdir(path.dirname(dbFile), { recursive: true });
  try {
    await readFile(dbFile, "utf8");
  } catch {
    await writeFile(dbFile, JSON.stringify(createInitialDatabase(), null, 2), "utf8");
  }
}

export async function readDb(): Promise<MockDatabase> {
  await ensureDb();
  const raw = await readFile(dbFile, "utf8");
  return JSON.parse(raw) as MockDatabase;
}

export async function writeDb(db: MockDatabase) {
  await ensureDb();
  await writeFile(dbFile, JSON.stringify(db, null, 2), "utf8");
}

export async function updateDb(mutator: (db: MockDatabase) => MockDatabase | void) {
  const db = await readDb();
  const next = mutator(db) ?? db;
  await writeDb(next);
  return next;
}

export function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function createNotification(input: Omit<NotificationRecord, "id" | "createdAt" | "read">) {
  return updateDb((db) => {
    db.notifications.unshift({
      id: makeId("notification"),
      createdAt: new Date().toISOString(),
      read: false,
      ...input,
    });
  });
}

export async function getViewerData(session?: { userId: string; role: Role }) {
  const db = await readDb();
  const user = session ? db.users.find((item) => item.id === session.userId) : undefined;
  const bookerProfile =
    session?.role === "BOOKER"
      ? db.bookers.find((item) => item.userId === session.userId)
      : undefined;
  const artistProfile =
    session?.role === "ARTIST"
      ? db.artists.find((item) => item.userId === session.userId)
      : undefined;

  return {
    db,
    user,
    bookerProfile,
    artistProfile,
    dashboardPath: user ? buildDashboardPath(user.role) : "/login",
  };
}
