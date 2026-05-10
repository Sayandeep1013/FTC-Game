import { DeckDetailPageClient } from "@/components/deck/DeckDetailPageClient";
import { getPublicUniverses } from "@/lib/data/universes";
import type { Deck, Universe } from "@/types";

export const dynamic = "force-dynamic";

export default async function DeckDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const universes = await getPublicUniverses({ includeCards: true }) as Universe[];
  let deck: Deck | null = null;
  let universe: Universe | null = null;

  for (const row of universes) {
    const match = row.decks?.find((d) => d.slug === slug);
    if (match) {
      deck = match;
      universe = row;
      break;
    }
  }

  return <DeckDetailPageClient deck={deck} universe={universe} />;
}
