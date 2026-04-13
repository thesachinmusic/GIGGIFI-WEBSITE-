import { GiggiFiApp } from "@/components/giggifi-app";
import { getServerAuthSession } from "@/lib/auth";
import { loadAppData } from "@/lib/app-data";

export const dynamic = "force-dynamic";

export default async function RoutedPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const [db, session] = await Promise.all([loadAppData(), getServerAuthSession()]);

  return (
    <GiggiFiApp
      slug={params.slug ?? []}
      initialDb={db}
      initialSession={
        session?.user?.id
          ? {
              userId: session.user.id,
              role: session.user.role ?? null,
              phone: session.user.phone ?? "",
              name: session.user.name ?? "GiggiFi User",
            }
          : null
      }
      pendingPhone={null}
    />
  );
}
