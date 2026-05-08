import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/HomeContent";
import type { Deck } from "@/types";

async function getPageData() {
  const supabase = await createClient();
  const [{ data: decks }, { count: cardCount }] = await Promise.all([
    supabase
      .from("decks")
      .select(`
        id, name, slug, cover_image_url, is_active, created_at,
        stat_definitions (id, deck_id, name, display_name, is_inverse, display_order),
        cards (
          id, deck_id, name, image_url, image_storage_path,
          card_stats (id, card_id, stat_definition_id, value)
        )
      `)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .in(
        "deck_id",
        (await supabase.from("decks").select("id").eq("is_active", true)).data?.map(d => d.id) ?? []
      ),
  ]);

  return {
    decks: (decks ?? []) as Deck[],
    cardCount: cardCount ?? 0,
  };
}

export default async function HomePage() {
  const { decks, cardCount } = await getPageData();

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      <section className="px-4 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24 border-b-2 border-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-4">
              Real-time · Multiplayer · Turn-based
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
                Pick a deck · Call your stat · Win
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Animated content (stats strip + how to play + deck carousel) ── */}
      <HomeContent decks={decks} deckCount={decks.length} cardCount={cardCount} />
    </main>
  );
}
