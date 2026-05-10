"use client";

import { useMemo, useState } from "react";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { RoomModal } from "@/components/room/RoomModal";
import type { Deck, Universe } from "@/types";

export function PlayPageClient({ initialUniverses }: { initialUniverses: Universe[] }) {
  const [universes] = useState<Universe[]>(initialUniverses);
  const [search, setSearch] = useState("");
  const [selectedUniverseId, setSelectedUniverseId] = useState(() => initialUniverses[0]?.id ?? "");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  const filteredUniverses = useMemo(() => universes.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.decks?.some(d => d.name.toLowerCase().includes(search.toLowerCase()))
  ), [universes, search]);
  const selectedUniverse = useMemo(
    () => universes.find(u => u.id === selectedUniverseId) ?? filteredUniverses[0] ?? null,
    [universes, selectedUniverseId, filteredUniverses]
  );
  const decks = (selectedUniverse?.decks ?? []) as Deck[];

  function pickUniverse(id: string) {
    setSelectedUniverseId(id);
    setSelectedDeck(null);
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <div className="mb-8 border-b-2 border-black pb-6">
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">Ready?</p>
          <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)" }}>
            LET&apos;S PLAY
          </h1>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <section className="border-2 border-black bg-white" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
            <div className="bg-black text-white px-4 py-3 border-b-2 border-black">
              <p className="font-display tracking-widest text-lg">01 UNIVERSE</p>
              <p className="text-[9px] text-grey-mid uppercase tracking-wider">Pick the world first</p>
            </div>
            <div className="p-3 border-b-2 border-black">
              <input className="input-brutal text-xs" placeholder="Search universe or deck..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-[420px] overflow-y-auto scrollbar-brutal">
              {filteredUniverses.length === 0 ? (
                <div className="p-5 text-xs text-grey-mid">No universes found.</div>
              ) : filteredUniverses.map(universe => (
                <button
                  key={universe.id}
                  onClick={() => pickUniverse(universe.id)}
                  className={`w-full px-4 py-3 text-left border-b border-grey-light transition-colors ${selectedUniverse?.id === universe.id ? "bg-black text-white" : "bg-white hover:bg-grey-light"}`}
                >
                  <span className="block font-bold text-xs uppercase tracking-wider">{universe.name}</span>
                  <span className="block text-[9px] opacity-60 uppercase tracking-wider mt-0.5">{universe.decks?.length ?? 0} decks</span>
                </button>
              ))}
            </div>
          </section>

          <section className="border-2 border-black bg-white" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
            <div className="bg-black text-white px-4 py-3 border-b-2 border-black">
              <p className="font-display tracking-widest text-lg">02 DECK</p>
              <p className="text-[9px] text-grey-mid uppercase tracking-wider">{selectedUniverse ? selectedUniverse.name : "Select a universe"}</p>
            </div>

            <div className="p-4">
              {decks.length === 0 ? (
                <div className="border-2 border-dashed border-grey-mid p-8 text-center text-xs text-grey-mid">
                  No active decks in this universe yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {decks.map(deck => (
                    <button
                      key={deck.id}
                      onClick={() => setSelectedDeck(deck)}
                      className={`border-2 text-left transition-all ${selectedDeck?.id === deck.id ? "border-black bg-grey-light" : "border-black bg-white hover:-translate-y-0.5"}`}
                      style={{ boxShadow: selectedDeck?.id === deck.id ? "5px 5px 0 #0a0a0a" : "3px 3px 0 #0a0a0a" }}
                    >
                      <div className="h-32 border-b-2 border-black">
                        <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
                      </div>
                      <div className="p-3">
                        <p className="font-display tracking-wider text-lg leading-tight">{deck.name.toUpperCase()}</p>
                        <p className="text-[9px] text-grey-dark font-mono mt-1">{deck.card_count ?? deck.cards?.length ?? 0} cards / {deck.stat_count ?? deck.stat_definitions?.length ?? 0} stats</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`mt-5 border-2 border-black bg-white p-5 transition-opacity ${selectedDeck ? "opacity-100" : "opacity-35 pointer-events-none"}`} style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="font-display tracking-widest text-lg">03 START</p>
              <p className="text-[10px] text-grey-dark uppercase tracking-wider">
                {selectedDeck ? `Selected: ${selectedUniverse?.name} / ${selectedDeck.name}` : "Pick a universe and deck first"}
              </p>
            </div>
            <button onClick={() => selectedDeck && setPlayDeck(selectedDeck)} className="btn-brutal btn-primary px-8 py-3">
              Continue
            </button>
          </div>
        </section>
      </div>

      {playDeck && <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />}
    </main>
  );
}
