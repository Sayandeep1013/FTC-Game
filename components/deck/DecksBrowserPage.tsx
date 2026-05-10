"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { RoomModal } from "@/components/room/RoomModal";
import type { Deck, Universe } from "@/types";

export function DecksBrowserPage({ initialUniverses, initialUniverseSlug }: { initialUniverses: Universe[]; initialUniverseSlug?: string }) {
  const [universes] = useState<Universe[]>(initialUniverses);
  const [search, setSearch] = useState("");
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(() => {
    const requested = initialUniverses.find((u) => u.slug === initialUniverseSlug);
    return requested?.id ?? "all";
  });
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  const filteredUniverses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return universes
      .filter((u) => selectedUniverseId === "all" || u.id === selectedUniverseId)
      .map((u) => ({
        ...u,
        decks: (u.decks ?? []).filter((d) => {
          if (!q) return true;
          return (
            u.name.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q) ||
            d.cards?.some((c) => c.name?.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((u) => (u.decks?.length ?? 0) > 0 || (!!q && u.name.toLowerCase().includes(q)));
  }, [universes, search, selectedUniverseId]);

  const deckCount = universes.reduce((sum, u) => sum + (u.decks?.length ?? 0), 0);

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8 border-b-2 border-black pb-6">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">Browse</p>
          <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
            UNIVERSES
          </h1>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono text-grey-mid">{universes.length} universes / {deckCount} decks</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <aside className="border-2 border-black bg-white h-max" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
          <div className="bg-black text-white px-4 py-3 border-b-2 border-black">
            <p className="font-display tracking-widest text-lg">FILTER</p>
          </div>
          <div className="p-3 border-b-2 border-black">
            <input className="input-brutal text-xs" placeholder="Search universes, decks, cards..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setSelectedUniverseId("all")} className={`w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-b border-grey-light ${selectedUniverseId === "all" ? "bg-black text-white" : "hover:bg-grey-light"}`}>
            All Universes
          </button>
          {universes.map((u) => (
            <button key={u.id} onClick={() => setSelectedUniverseId(u.id)} className={`w-full px-4 py-3 text-left border-b border-grey-light ${selectedUniverseId === u.id ? "bg-black text-white" : "hover:bg-grey-light"}`}>
              <span className="block text-xs font-bold uppercase tracking-wider">{u.name}</span>
              <span className="block text-[9px] opacity-60 uppercase tracking-wider">{u.decks?.length ?? 0} decks</span>
            </button>
          ))}
        </aside>

        <section>
          {filteredUniverses.length === 0 ? (
            <div className="panel-brutal p-10 text-center max-w-sm mx-auto">
              <p className="font-bold text-grey-dark">No decks match your search.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredUniverses.map((universe) => (
                <div key={universe.id} className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
                  <div className="bg-black text-white px-5 py-3 border-b-2 border-black">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display tracking-widest text-xl">{universe.name.toUpperCase()}</h2>
                        <p className="text-[9px] text-grey-mid uppercase tracking-wider">{universe.description || `${universe.decks?.length ?? 0} decks`}</p>
                      </div>
                      <Link href={`/universes/${universe.slug}`} className="text-[9px] font-bold uppercase tracking-wider border border-white px-3 py-1.5 hover:bg-white hover:text-black transition-colors">
                        Open Universe
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-5 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
                    {(universe.decks ?? []).map((deck) => (
                      <DeckCard key={deck.id} deck={deck} universe={universe} onPlay={() => setPlayDeck(deck)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {playDeck && <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />}
    </main>
  );
}

function DeckCard({ deck, universe, onPlay }: { deck: Deck; universe: Universe; onPlay: () => void }) {
  const cardCount = deck.card_count ?? deck.cards?.length ?? 0;
  const statCount = deck.stat_count ?? deck.stat_definitions?.length ?? 0;

  return (
    <div className="border-2 border-black bg-white flex flex-col" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
      <Link href={`/decks/${deck.slug}`} className="border-b-2 border-black block" style={{ height: 160 }}>
        <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
      </Link>
      <div className="bg-black px-3 py-2 border-b-2 border-black">
        <p className="text-[8px] text-grey-mid uppercase tracking-wider mb-0.5">{universe.name}</p>
        <h3 className="font-display text-white tracking-wider leading-tight" style={{ fontSize: "1.15rem" }}>{deck.name.toUpperCase()}</h3>
      </div>
      <div className="px-3 py-3 flex-1 flex flex-col justify-between">
        <div className="flex gap-3 text-[9px] text-grey-dark font-mono font-bold uppercase tracking-wider mb-4">
          <span>{cardCount} Cards</span>
          <span>{statCount} Stats</span>
        </div>
        <div className="flex gap-0 border-t-2 border-black -mx-3 -mb-3 mt-auto">
          <Link href={`/decks/${deck.slug}`} className="deck-btn-light flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-black">Details</Link>
          <button onClick={onPlay} className="deck-btn-dark flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider">Play</button>
        </div>
      </div>
    </div>
  );
}
