import { GiggiFiApp } from "@/components/giggifi-app";
import { getPendingPhoneFromCookies, getSessionFromCookies } from "@/lib/session";
import { readDb } from "@/lib/server-db";

export const dynamic = "force-dynamic";

export default async function RoutedPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const db = await readDb();
  const session = getSessionFromCookies();
  const pendingPhone = getPendingPhoneFromCookies();

  return (
    <GiggiFiApp
      slug={params.slug ?? []}
      initialDb={db}
      initialSession={session}
      pendingPhone={pendingPhone}
    />
  );
}
