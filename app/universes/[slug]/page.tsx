import { UniverseDetailPageClient } from "@/components/deck/UniverseDetailPageClient";
import { getPublicUniverses } from "@/lib/data/universes";
import type { Universe } from "@/types";

export const dynamic = "force-dynamic";

export default async function UniverseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const universes = await getPublicUniverses({ slug }) as Universe[];

  return <UniverseDetailPageClient universe={universes[0] ?? null} />;
}
