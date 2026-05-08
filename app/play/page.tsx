"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { RoomModal } from "@/components/room/RoomModal";
import type { Deck } from "@/types";

export default function PlayPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Deck | null>(null);
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("decks")
      .select("id, name, slug, cover_image_url, is_active, created_at, stat_definitions(count), cards(count)")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => { setDecks((data ?? []) as unknown as Deck[]); setLoading(false); });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = decks.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));

  function pick(deck: Deck) {
    setSelected(deck);
    setQuery(deck.name);
    setOpen(false);
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-16">

        {/* Header */}
        <div className="mb-10 border-b-2 border-black pb-6">
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">Ready?</p>
          <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)" }}>
            LET&apos;S PLAY
          </h1>
        </div>

        {/* Step 1 — Pick a deck */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display text-4xl leading-none text-grey-light select-none">01</span>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">Pick a Deck</p>
              <p className="text-[10px] text-grey-dark">Choose the universe you want to battle in</p>
            </div>
          </div>

          {/* Searchable dropdown */}
          <div ref={dropdownRef} className="relative">
            <div
              className="input-brutal flex items-center gap-3 cursor-pointer select-none"
              onClick={() => { if (!loading) setOpen(o => !o); }}
            >
              {selected ? (
                <>
                  <div className="w-8 h-10 flex-shrink-0 border border-black overflow-hidden">
                    <DeckCoverArt slug={selected.slug} name={selected.name} coverImageUrl={selected.cover_image_url} className="w-full h-full" />
                  </div>
                  <span className="font-bold text-sm">{selected.name}</span>
                  <button
                    className="ml-auto text-grey-mid hover:text-black text-xs font-bold"
                    onClick={e => { e.stopPropagation(); setSelected(null); setQuery(""); }}
                  >✕</button>
                </>
              ) : (
                <>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-grey-mid"
                    placeholder={loading ? "Loading decks..." : "Search decks..."}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    readOnly={loading}
                  />
                  <span className="text-grey-mid text-xs">▾</span>
                </>
              )}
            </div>

            {open && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 border-2 border-black border-t-0 bg-white max-h-64 overflow-y-auto scrollbar-brutal" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
                {filtered.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => pick(deck)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-black hover:text-white transition-colors border-b border-grey-light last:border-b-0 group"
                  >
                    <div className="w-7 h-9 flex-shrink-0 border border-black overflow-hidden group-hover:border-white">
                      <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
                    </div>
                    <span className="font-bold text-sm">{deck.name}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-4 py-3 text-xs text-grey-mid">No decks match &quot;{query}&quot;</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2 — Launch */}
        <div className={`transition-opacity duration-200 ${selected ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
          <div className="flex items-center gap-3 mb-5">
            <span className="font-display text-4xl leading-none text-grey-light select-none">02</span>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">Start Playing</p>
              <p className="text-[10px] text-grey-dark">Create a new room or jump into an existing one</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => selected && setPlayDeck(selected)}
              className="btn-brutal btn-primary py-5 flex flex-col items-center gap-1"
            >
              <span className="font-display tracking-widest text-base">CREATE ROOM</span>
              <span className="text-[9px] opacity-60 uppercase tracking-wider font-normal">Invite friends or add CPU</span>
            </button>
            <button
              onClick={() => selected && setPlayDeck(selected)}
              className="btn-brutal btn-secondary py-5 flex flex-col items-center gap-1"
            >
              <span className="font-display tracking-widest text-base">JOIN ROOM</span>
              <span className="text-[9px] text-grey-dark uppercase tracking-wider font-normal">Enter a room code</span>
            </button>
          </div>

          {selected && (
            <p className="text-[9px] text-grey-mid text-center mt-3 uppercase tracking-wider">
              Playing with: <span className="font-bold text-black">{selected.name}</span>
            </p>
          )}
        </div>

      </div>

      {playDeck && <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />}
    </main>
  );
}
