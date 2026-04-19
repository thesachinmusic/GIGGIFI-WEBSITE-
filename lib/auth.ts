import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role, UserStatus, type Prisma } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { getOtpMode, verifyOtpChallenge } from "@/lib/otp";
import { getAuthSessionUser } from "@/lib/services/auth-user-service";
import { normalizeIndianPhone, verifyOtpSchema } from "@/lib/validations";

export function isGoogleAuthEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getAuthProviderFlags() {
  return {
    googleEnabled: isGoogleAuthEnabled(),
    otpMode: getOtpMode(),
  };
}

async function ensureOtpUser(phone: string) {
  const normalizedPhone = normalizeIndianPhone(phone);
  const existing = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        phoneVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        status: existing.status === UserStatus.SUSPENDED ? existing.status : UserStatus.ACTIVE,
      },
    });
  }

  return prisma.user.create({
    data: {
      phone: normalizedPhone,
      name: normalizedPhone,
      phoneVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      status: UserStatus.ACTIVE,
    },
  });
}

const providers = [];

if (isGoogleAuthEnabled()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  CredentialsProvider({
    id: "phone-otp",
    name: "Phone OTP",
    credentials: {
      phone: { label: "Phone", type: "text" },
      otp: { label: "OTP", type: "text" },
    },
    async authorize(credentials) {
      const parsed = verifyOtpSchema.safeParse(credentials);

      if (!parsed.success) {
        throw new Error("Invalid OTP input.");
      }

      await verifyOtpChallenge(parsed.data.phone, parsed.data.otp, true);
      const user = await ensureOtpUser(parsed.data.phone);

      return {
        id: user.id,
        name: user.name ?? user.phone ?? "GiggiFi User",
        email: user.email ?? undefined,
        image: user.image ?? undefined,
      };
    },
  }),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) {
        return token;
      }

      const dbUser = await getAuthSessionUser(userId);
      if (!dbUser) {
        return token;
      }

      token.sub = dbUser.id;
      token.name = dbUser.name ?? token.name;
      token.email = dbUser.email ?? token.email;
      token.picture = dbUser.image ?? token.picture;
      token.role = dbUser.role ?? null;
      token.phone = dbUser.phone ?? null;
      token.emailVerified = Boolean(dbUser.emailVerified);
      token.phoneVerified = Boolean(dbUser.phoneVerifiedAt);
      token.onboardingState = dbUser.onboardingState;
      token.onboardingDraftRole = dbUser.onboardingDraft?.role ?? null;
      token.hasArtistProfile = Boolean(dbUser.artistProfile);
      token.hasBookerProfile = Boolean(dbUser.bookerProfile);

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.role = (token.role as Role | null | undefined) ?? null;
      session.user.phone = (token.phone as string | null | undefined) ?? null;
      session.user.emailVerified = Boolean(token.emailVerified);
      session.user.phoneVerified = Boolean(token.phoneVerified);
      session.user.onboardingState = token.onboardingState as string | null | undefined;
      session.user.onboardingDraftRole =
        (token.onboardingDraftRole as Role | null | undefined) ?? null;
      session.user.hasArtistProfile = Boolean(token.hasArtistProfile);
      session.user.hasBookerProfile = Boolean(token.hasBookerProfile);

      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!user?.id) {
        return;
      }

      const updates: Prisma.UserUpdateInput = {
        lastLoginAt: new Date(),
      };

      if (account?.provider === "google") {
        const profileRecord =
          profile && typeof profile === "object" ? (profile as Record<string, unknown>) : null;
        updates.status = UserStatus.ACTIVE;
        updates.emailVerified = new Date();
        updates.email = user.email ?? undefined;
        updates.name =
          user.name ??
          (typeof profile?.name === "string" ? profile.name : undefined) ??
          undefined;
        updates.image =
          user.image ??
          (profileRecord && typeof profileRecord.picture === "string"
            ? profileRecord.picture
            : undefined) ??
          undefined;
      }

      await prisma.user.updateMany({
        where: { id: user.id },
        data: updates,
      });
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getRequiredUserSession() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error("AUTH_REQUIRED");
  }

  return session;
}
