"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { DeckDetailsModal } from "@/components/deck/DeckDetailsModal";
import { RoomModal } from "@/components/room/RoomModal";
import type { Deck } from "@/types";

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailDeck, setDetailDeck] = useState<Deck | null>(null);
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("decks")
      .select(`
        id, name, slug, cover_image_url, is_active, created_at,
        stat_definitions (id, deck_id, name, display_name, is_inverse, display_order),
        cards (id, deck_id, name, image_url, image_storage_path,
          card_stats (id, card_id, stat_definition_id, value))
      `)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setDecks((data ?? []) as Deck[]);
        setLoading(false);
      });
  }, []);

  const filtered = decks.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8 border-b-2 border-black pb-6">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">Browse</p>
          <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
            ALL DECKS
          </h1>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono text-grey-mid">{decks.length} decks available</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <input
          className="input-brutal"
          placeholder="Search decks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel-brutal p-10 text-center max-w-sm mx-auto">
          <p className="font-bold text-grey-dark">{search ? "No decks match your search." : "No decks available yet."}</p>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filtered.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDetails={() => setDetailDeck(deck)}
              onPlay={() => setPlayDeck(deck)}
            />
          ))}
        </div>
      )}

      {detailDeck && <DeckDetailsModal deck={detailDeck} onClose={() => setDetailDeck(null)} />}
      {playDeck && <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />}
    </main>
  );
}

function DeckCard({ deck, onDetails, onPlay }: { deck: Deck; onDetails: () => void; onPlay: () => void }) {
  const cardCount = deck.cards?.length ?? 0;
  const statCount = deck.stat_definitions?.length ?? 0;

  return (
    <div className="border-2 border-black bg-white flex flex-col" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
      {/* Cover */}
      <div className="border-b-2 border-black" style={{ height: 200 }}>
        <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
      </div>

      {/* Name */}
      <div className="bg-black px-4 py-2.5 border-b-2 border-black">
        <h3 className="font-display text-white tracking-wider leading-tight" style={{ fontSize: "1.3rem" }}>
          {deck.name.toUpperCase()}
        </h3>
      </div>

      {/* Meta */}
      <div className="px-4 py-3 flex-1 flex flex-col justify-between">
        <div className="flex gap-4 text-[10px] text-grey-dark font-mono font-bold uppercase tracking-wider mb-4">
          <span>{cardCount} Cards</span>
          <span>{statCount} Stats</span>
        </div>

        {/* Actions */}
        <div className="flex gap-0 border-t-2 border-black -mx-4 -mb-3 mt-auto">
          <button
            onClick={onDetails}
            className="deck-btn-light flex-1 py-3 text-[11px] font-bold uppercase tracking-wider border-r border-black"
          >
            Details
          </button>
          <button
            onClick={onPlay}
            className="deck-btn-dark flex-1 py-3 text-[11px] font-bold uppercase tracking-wider"
          >
            Play →
          </button>
        </div>
      </div>
    </div>
  );
}
