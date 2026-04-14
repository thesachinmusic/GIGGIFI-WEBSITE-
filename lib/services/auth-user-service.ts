import "server-only";

import { UserStatus, type Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const authSessionUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  status: true,
  onboardingState: true,
  emailVerified: true,
  phoneVerifiedAt: true,
  artistProfile: {
    select: { id: true },
  },
  bookerProfile: {
    select: { id: true },
  },
  onboardingDraft: {
    select: { role: true },
  },
} satisfies Prisma.UserSelect;

const mergeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  status: true,
  onboardingState: true,
  emailVerified: true,
  phoneVerifiedAt: true,
  artistProfile: {
    select: { id: true },
  },
  bookerProfile: {
    select: { id: true },
  },
  onboardingDraft: {
    select: { id: true, role: true },
  },
  bookingDrafts: {
    select: { id: true, artistId: true },
  },
} satisfies Prisma.UserSelect;

export type AuthSessionUser = Prisma.UserGetPayload<{
  select: typeof authSessionUserSelect;
}>;

type MergeUserRecord = Prisma.UserGetPayload<{
  select: typeof mergeUserSelect;
}>;

function pickDate(first?: Date | null, second?: Date | null) {
  if (first && second) {
    return first.getTime() >= second.getTime() ? first : second;
  }

  return first ?? second ?? null;
}

async function loadMergeUsers(tx: Prisma.TransactionClient, keepUserId: string, removeUserId: string) {
  const [keepUser, removeUser] = await Promise.all([
    tx.user.findUnique({ where: { id: keepUserId }, select: mergeUserSelect }),
    tx.user.findUnique({ where: { id: removeUserId }, select: mergeUserSelect }),
  ]);

  if (!keepUser) {
    throw new Error("Current user account was not found.");
  }

  if (!removeUser) {
    throw new Error("Linked user account was not found.");
  }

  return { keepUser, removeUser };
}

async function mergeUsersIntoCurrent(
  tx: Prisma.TransactionClient,
  keepUserId: string,
  removeUserId: string,
) {
  if (keepUserId === removeUserId) {
    return;
  }

  const { keepUser, removeUser } = await loadMergeUsers(tx, keepUserId, removeUserId);

  const sameProfileConflict =
    (keepUser.artistProfile && removeUser.artistProfile) ||
    (keepUser.bookerProfile && removeUser.bookerProfile);

  if (sameProfileConflict) {
    throw new Error(
      "This contact is already linked to another fully configured GiggiFi account. Please use that login method instead.",
    );
  }

  if (keepUser.onboardingDraft && removeUser.onboardingDraft) {
    throw new Error(
      "We found another in-progress GiggiFi account for this contact. Please finish onboarding from the original account or contact support.",
    );
  }

  const duplicateDraftArtistIds = new Set(keepUser.bookingDrafts.map((draft) => draft.artistId));
  const hasBookingDraftConflict = removeUser.bookingDrafts.some((draft) =>
    duplicateDraftArtistIds.has(draft.artistId),
  );

  if (hasBookingDraftConflict) {
    throw new Error(
      "This contact is already tied to another GiggiFi account with draft bookings. Please continue with the original account.",
    );
  }

  await tx.account.updateMany({
    where: { userId: removeUser.id },
    data: { userId: keepUser.id },
  });

  await tx.session.updateMany({
    where: { userId: removeUser.id },
    data: { userId: keepUser.id },
  });

  await tx.notification.updateMany({
    where: { userId: removeUser.id },
    data: { userId: keepUser.id },
  });

  await tx.kYCDocument.updateMany({
    where: { userId: removeUser.id },
    data: { userId: keepUser.id },
  });

  await tx.otpChallenge.updateMany({
    where: { userId: removeUser.id },
    data: { userId: keepUser.id },
  });

  if (removeUser.artistProfile) {
    await tx.artistProfile.update({
      where: { userId: removeUser.id },
      data: { userId: keepUser.id },
    });
  }

  if (removeUser.bookerProfile) {
    await tx.bookerProfile.update({
      where: { userId: removeUser.id },
      data: { userId: keepUser.id },
    });
  }

  if (removeUser.onboardingDraft) {
    await tx.onboardingDraft.update({
      where: { userId: removeUser.id },
      data: { userId: keepUser.id },
    });
  }

  if (removeUser.bookingDrafts.length > 0) {
    await tx.bookingDraft.updateMany({
      where: { userId: removeUser.id },
      data: { userId: keepUser.id },
    });
  }

  await tx.user.update({
    where: { id: keepUser.id },
    data: {
      name: keepUser.name ?? removeUser.name,
      email: keepUser.email ?? removeUser.email,
      phone: keepUser.phone ?? removeUser.phone,
      image: keepUser.image ?? removeUser.image,
      role: keepUser.role ?? removeUser.role,
      status:
        keepUser.status === UserStatus.SUSPENDED || removeUser.status === UserStatus.SUSPENDED
          ? UserStatus.SUSPENDED
          : keepUser.status === UserStatus.ACTIVE || removeUser.status === UserStatus.ACTIVE
            ? UserStatus.ACTIVE
            : UserStatus.PENDING_VERIFICATION,
      onboardingState:
        keepUser.onboardingState === "PROFILE_IN_PROGRESS" ||
        removeUser.onboardingState === "PROFILE_IN_PROGRESS"
          ? "PROFILE_IN_PROGRESS"
          : keepUser.onboardingState === "COMPLETE" || removeUser.onboardingState === "COMPLETE"
            ? "COMPLETE"
            : "ROLE_SELECTION",
      emailVerified: pickDate(keepUser.emailVerified, removeUser.emailVerified),
      phoneVerifiedAt: pickDate(keepUser.phoneVerifiedAt, removeUser.phoneVerifiedAt),
      lastLoginAt: new Date(),
    },
  });

  await tx.user.delete({
    where: { id: removeUser.id },
  });
}

async function claimEmailForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  email: string,
) {
  const existing = await tx.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    await mergeUsersIntoCurrent(tx, userId, existing.id);
  }
}

async function claimPhoneForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  phone: string,
) {
  const existing = await tx.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    await mergeUsersIntoCurrent(tx, userId, existing.id);
  }
}

export async function getAuthSessionUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: authSessionUserSelect,
  });
}

export async function saveUserEmailContact(input: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await claimEmailForUser(tx, input.userId, input.email);

    return tx.user.update({
      where: { id: input.userId },
      data: {
        email: input.email,
        name: input.name || undefined,
        lastLoginAt: new Date(),
      },
      select: authSessionUserSelect,
    });
  });
}

export async function verifyAndSaveUserPhone(input: {
  userId: string;
  phone: string;
}) {
  return prisma.$transaction(async (tx) => {
    await claimPhoneForUser(tx, input.userId, input.phone);

    return tx.user.update({
      where: { id: input.userId },
      data: {
        phone: input.phone,
        phoneVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      },
      select: authSessionUserSelect,
    });
  });
}

export async function setSelectedUserRole(input: {
  userId: string;
  role: Exclude<Role, "ADMIN">;
}) {
  const currentUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      artistProfile: { select: { id: true } },
      bookerProfile: { select: { id: true } },
      status: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  const hasProfile =
    input.role === "ARTIST"
      ? Boolean(currentUser.artistProfile)
      : Boolean(currentUser.bookerProfile);

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      role: input.role,
      onboardingState: hasProfile ? "COMPLETE" : "PROFILE_IN_PROGRESS",
      status:
        input.role === "BOOKER" && currentUser.status !== UserStatus.SUSPENDED
          ? UserStatus.ACTIVE
          : currentUser.status,
    },
    select: authSessionUserSelect,
  });
}
