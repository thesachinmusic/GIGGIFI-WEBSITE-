import { Role } from "@prisma/client";

export function buildDashboardPath(role: Role | null | undefined) {
  if (role === Role.ARTIST) return "/artist/dashboard";
  if (role === Role.BOOKER) return "/booker/dashboard";
  if (role === Role.ADMIN) return "/admin";
  return "/onboarding/choice";
}

export function hasCompletedRoleProfile(input: {
  role: Role | null | undefined;
  hasArtistProfile?: boolean | null;
  hasBookerProfile?: boolean | null;
}) {
  if (input.role === Role.ARTIST) return Boolean(input.hasArtistProfile);
  if (input.role === Role.BOOKER) return Boolean(input.hasBookerProfile);
  if (input.role === Role.ADMIN) return true;
  return false;
}
