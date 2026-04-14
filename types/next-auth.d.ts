import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role | null;
      phone: string | null;
      emailVerified: boolean;
      phoneVerified: boolean;
      onboardingState?: string | null;
      onboardingDraftRole?: Role | null;
      hasArtistProfile: boolean;
      hasBookerProfile: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role | null;
    phone?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    onboardingState?: string | null;
    onboardingDraftRole?: Role | null;
    hasArtistProfile?: boolean;
    hasBookerProfile?: boolean;
  }
}
