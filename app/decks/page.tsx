import { DecksBrowserPage } from "@/components/deck/DecksBrowserPage";
import { getPublicUniverses } from "@/lib/data/universes";
import type { Universe } from "@/types";

export const dynamic = "force-dynamic";

export default async function DecksPage({ searchParams }: { searchParams: Promise<{ universe?: string }> }) {
  const params = await searchParams;
  const universes = await getPublicUniverses() as Universe[];

  return <DecksBrowserPage initialUniverses={universes} initialUniverseSlug={params.universe} />;
}
