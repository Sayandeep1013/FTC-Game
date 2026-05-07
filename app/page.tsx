import { createClient } from "@/lib/supabase/server";
import { DeckCarousel } from "@/components/deck/DeckCarousel";
import { BuyMeCoffee } from "@/components/ui/BuyMeCoffee";
import type { Deck } from "@/types";

async function getDecks(): Promise<Deck[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
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
    .order("name");

  if (error || !data) return [];
  return data as Deck[];
}

export default async function HomePage() {
  const decks = await getDecks();

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="px-4 sm:px-8 pt-8 sm:pt-10 pb-6 border-b-2 border-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Left: title */}
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-2">
              Real-time · Multiplayer · Turn-based
            </p>
            <h1
              className="font-display text-black leading-[0.88]"
              style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)", letterSpacing: "0.04em" }}
            >
              FANTASY<br />TRUMP CARDS
            </h1>
          </div>

          {/* Right: descriptor strip */}
          <div className="sm:text-right flex-shrink-0">
            <div className="inline-block bg-black px-3 sm:px-4 py-2">
              <p className="text-white text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-bold">
                Pick a deck · Call your stat · Win
              </p>
            </div>
            <p className="text-[9px] text-grey-mid mt-2 uppercase tracking-wider hidden sm:block">
              {decks.length} decks · 52 cards each · 8 stats
            </p>
          </div>
        </div>
      </section>

      {/* ── Deck section label ── */}
      <section className="pt-6 pb-0 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-4">
          <h2 className="font-display text-lg sm:text-xl tracking-widest whitespace-nowrap">
            CHOOSE YOUR DECK
          </h2>
          <div className="flex-1 border-t-2 border-black" />
          <span className="text-[9px] uppercase tracking-wider text-grey-mid font-bold whitespace-nowrap hidden sm:block">
            Hover to preview
          </span>
        </div>
      </section>

      {/* ── Carousel ── */}
      <section className="pt-4 pb-16">
        {decks.length === 0 ? (
          <div className="px-8">
            <div className="panel-brutal p-8 text-center max-w-sm mx-auto">
              <p className="font-bold text-grey-dark text-sm">No decks available yet.</p>
            </div>
          </div>
        ) : (
          <DeckCarousel decks={decks} />
        )}
      </section>

      <BuyMeCoffee />
    </main>
  );
}
