type AppRole = "ARTIST" | "BOOKER" | "ADMIN";
type AppOnboardingState = "ROLE_SELECTION" | "PROFILE_IN_PROGRESS" | "COMPLETE";

export type AuthRoutingState = {
  role?: AppRole | null;
  phone?: string | null;
  email?: string | null;
  onboardingState?: AppOnboardingState | null;
  onboardingDraftRole?: AppRole | null;
  hasArtistProfile?: boolean | null;
  hasBookerProfile?: boolean | null;
};

export function buildDashboardPath(role: AppRole | null | undefined) {
  if (role === "ARTIST") return "/artist/dashboard";
  if (role === "BOOKER") return "/booker/dashboard";
  if (role === "ADMIN") return "/admin";
  return "/onboarding/choice";
}

export function buildRoleOnboardingPath(role: Exclude<AppRole, "ADMIN">) {
  return role === "ARTIST" ? "/onboarding/artist" : "/onboarding/booker";
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

export function hasRequiredContactDetails(input: Pick<AuthRoutingState, "phone" | "email">) {
  return Boolean(input.phone && input.email);
}

export function getMissingContactFields(input: Pick<AuthRoutingState, "phone" | "email">) {
  return {
    phone: !input.phone,
    email: !input.email,
  };
}

export function buildContactCompletionPath(input: Pick<AuthRoutingState, "phone" | "email">) {
  const params = new URLSearchParams();
  const missing = getMissingContactFields(input);

  if (missing.phone) {
    params.append("missing", "phone");
  }

  if (missing.email) {
    params.append("missing", "email");
  }

  const query = params.toString();
  return query ? `/onboarding/contact?${query}` : "/onboarding/contact";
}

function inferCompletedRole(input: AuthRoutingState): AppRole | null {
  if (input.role === "ADMIN") return "ADMIN";
  if (input.role === "ARTIST" && input.hasArtistProfile) return "ARTIST";
  if (input.role === "BOOKER" && input.hasBookerProfile) return "BOOKER";
  if (!input.role && input.hasArtistProfile && !input.hasBookerProfile) return "ARTIST";
  if (!input.role && input.hasBookerProfile && !input.hasArtistProfile) return "BOOKER";
  return null;
}

function inferIncompleteRole(input: AuthRoutingState): Exclude<AppRole, "ADMIN"> | null {
  const role = input.role === "ARTIST" || input.role === "BOOKER" ? input.role : null;
  const draftRole =
    input.onboardingDraftRole === "ARTIST" || input.onboardingDraftRole === "BOOKER"
      ? input.onboardingDraftRole
      : null;

  if (role === "ARTIST" && !input.hasArtistProfile) return "ARTIST";
  if (role === "BOOKER" && !input.hasBookerProfile) return "BOOKER";
  if (draftRole === "ARTIST" && !input.hasArtistProfile) return "ARTIST";
  if (draftRole === "BOOKER" && !input.hasBookerProfile) return "BOOKER";
  return null;
}

export function resolveRoleSelectionRedirect(
  role: Exclude<AppRole, "ADMIN">,
  input: AuthRoutingState,
) {
  if (!hasRequiredContactDetails(input)) {
    return buildContactCompletionPath(input);
  }

  if (role === "ARTIST") {
    return input.hasArtistProfile ? buildDashboardPath("ARTIST") : buildRoleOnboardingPath("ARTIST");
  }

  return input.hasBookerProfile ? buildDashboardPath("BOOKER") : buildRoleOnboardingPath("BOOKER");
}

export function resolveAuthenticatedAppPath(input: AuthRoutingState) {
  if (!hasRequiredContactDetails(input)) {
    return buildContactCompletionPath(input);
  }

  const completedRole = inferCompletedRole(input);
  if (completedRole) {
    return buildDashboardPath(completedRole);
  }

  const incompleteRole = inferIncompleteRole(input);
  if (incompleteRole && input.onboardingState === "PROFILE_IN_PROGRESS") {
    return buildRoleOnboardingPath(incompleteRole);
  }

  return "/onboarding/choice";
}
