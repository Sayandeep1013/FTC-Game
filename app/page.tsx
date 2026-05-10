import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/HomeContent";
import type { Universe } from "@/types";

async function getPageData() {
  const supabase = await createClient();
  const { data: deckIds } = await supabase.from("decks").select("id").eq("is_active", true);
  const activeDeckIds = deckIds?.map((d) => d.id) ?? [];

  const [{ data: universes }, { count: cardCount }] = await Promise.all([
    supabase
      .from("universes")
      .select(`
        id, name, slug, description, cover_image_url, is_active, display_order, created_at,
        decks (
          id, universe_id, name, slug, cover_image_url, is_active, display_order, created_at,
          stat_definitions (count),
          cards (count)
        )
      `)
      .eq("is_active", true)
      .eq("decks.is_active", true)
      .order("display_order", { ascending: true })
      .order("name")
      .order("display_order", { referencedTable: "decks", ascending: true })
      .order("name", { referencedTable: "decks", ascending: true }),
    activeDeckIds.length > 0
      ? supabase
          .from("cards")
          .select("id", { count: "exact", head: true })
          .in("deck_id", activeDeckIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const visibleUniverses = ((universes ?? []) as unknown as Universe[])
    .map((u) => ({ ...u, decks: (u.decks ?? []).filter((d) => d.is_active) }))
    .filter((u) => (u.decks?.length ?? 0) > 0);

  return {
    universes: visibleUniverses,
    deckCount: visibleUniverses.reduce((sum, u) => sum + (u.decks?.length ?? 0), 0),
    cardCount: cardCount ?? 0,
  };
}

export default async function HomePage() {
  const { universes, deckCount, cardCount } = await getPageData();

  return (
    <main className="min-h-screen">
      <section className="px-4 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24 border-b-2 border-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-4">
              Real-time . Multiplayer . Turn-based
            </p>
            <h1
              className="font-display text-black leading-[0.88]"
              style={{ fontSize: "clamp(3rem, 10vw, 7.5rem)", letterSpacing: "0.04em" }}
            >
              FANTASY<br />TRUMP CARDS
            </h1>
          </div>
          <div className="sm:text-right flex-shrink-0 sm:mb-2">
            <div className="inline-block bg-black px-3 sm:px-4 py-2">
              <p className="text-white text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-bold">
                Pick universe . Pick deck . Win
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeContent universes={universes} deckCount={deckCount} cardCount={cardCount} />
    </main>
  );
}
