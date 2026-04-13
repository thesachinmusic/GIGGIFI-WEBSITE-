type AppRole = "ARTIST" | "BOOKER" | "ADMIN";

export function buildDashboardPath(role: AppRole | null | undefined) {
  if (role === "ARTIST") return "/artist/dashboard";
  if (role === "BOOKER") return "/booker/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/onboarding/choice";
}

export function hasCompletedRoleProfile(input: {
  role: AppRole | null | undefined;
  hasArtistProfile?: boolean | null;
  hasBookerProfile?: boolean | null;
}) {
  if (input.role === "ARTIST") return Boolean(input.hasArtistProfile);
  if (input.role === "BOOKER") return Boolean(input.hasBookerProfile);
  if (input.role === "ADMIN") return true;
  return false;
}
