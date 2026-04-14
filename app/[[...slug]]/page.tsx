import { GiggiFiApp } from "@/components/giggifi-app";
import { getAuthProviderFlags, getServerAuthSession } from "@/lib/auth";
import { loadAppData } from "@/lib/app-data";

export const dynamic = "force-dynamic";

export default async function RoutedPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const [db, session, authProviders] = await Promise.all([
    loadAppData(),
    getServerAuthSession(),
    Promise.resolve(getAuthProviderFlags()),
  ]);

  return (
    <GiggiFiApp
      slug={params.slug ?? []}
      initialDb={db}
      authProviders={authProviders}
      initialSession={
        session?.user?.id
          ? {
              userId: session.user.id,
              role: session.user.role ?? null,
              phone: session.user.phone ?? "",
              email: session.user.email ?? "",
              name: session.user.name ?? "GiggiFi User",
              onboardingState: session.user.onboardingState ?? null,
              onboardingDraftRole: session.user.onboardingDraftRole ?? null,
              hasArtistProfile: session.user.hasArtistProfile,
              hasBookerProfile: session.user.hasBookerProfile,
            }
          : null
      }
      pendingPhone={null}
    />
  );
}
