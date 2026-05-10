"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { RoomModal } from "@/components/room/RoomModal";
import type { Deck, Universe } from "@/types";

export function UniverseDetailPageClient({ universe }: { universe: Universe | null }) {
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);

  const decks = useMemo(
    () => [...(universe?.decks ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)),
    [universe]
  );

  if (!universe) {
    return (
      <main className="min-h-screen px-4 sm:px-8 py-16 max-w-3xl mx-auto">
        <div className="panel-brutal p-10 text-center">
          <h1 className="font-display tracking-widest text-2xl mb-2">UNIVERSE NOT FOUND</h1>
          <p className="text-xs text-grey-dark mb-5">This universe is inactive or does not have playable decks yet.</p>
          <Link href="/decks" className="btn-brutal btn-primary px-4 py-2 text-xs">Back to Universes</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-5">
        <Link href="/decks" className="text-[10px] font-bold uppercase tracking-wider text-grey-dark hover:text-black">
          Back to all universes
        </Link>
      </div>

      <section className="grid lg:grid-cols-[360px_1fr] gap-6 mb-8">
        <div className="border-2 border-black bg-white h-[380px]" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
          <DeckCoverArt slug={universe.slug} name={universe.name} coverImageUrl={universe.cover_image_url} className="w-full h-full" />
        </div>

        <div className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
          <div className="bg-black text-white px-5 py-4 border-b-2 border-black">
            <p className="text-[9px] text-grey-mid uppercase tracking-[0.25em] mb-1">Universe</p>
            <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)" }}>
              {universe.name.toUpperCase()}
            </h1>
          </div>
          <div className="p-5">
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <MetaBox label="Decks" value={String(decks.length)} />
              <MetaBox label="Cards" value={String(decks.reduce((sum, deck) => sum + (deck.card_count ?? deck.cards?.length ?? 0), 0))} />
              <MetaBox label="Status" value={universe.is_active ? "Public" : "Hidden"} />
            </div>
            <p className="text-sm text-grey-dark leading-relaxed">
              {universe.description || `Choose a ${universe.name} deck, inspect its cards, then start a room.`}
            </p>
          </div>
        </div>
      </section>

      <section className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
        <div className="bg-black text-white px-5 py-3 border-b-2 border-black">
          <h2 className="font-display tracking-widest text-xl">DECKS IN THIS UNIVERSE</h2>
          <p className="text-[9px] text-grey-mid uppercase tracking-wider">Pick the exact era or variant you want to play</p>
        </div>

        {decks.length === 0 ? (
          <div className="p-10 text-center text-xs text-grey-mid">No playable decks are active in this universe yet.</div>
        ) : (
          <div className="grid gap-5 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} onPlay={() => setPlayDeck(deck)} />
            ))}
          </div>
        )}
      </section>

      {playDeck && <RoomModal deck={playDeck} onClose={() => setPlayDeck(null)} />}
    </main>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black px-3 py-2 bg-white">
      <p className="text-[8px] uppercase tracking-wider text-grey-dark">{label}</p>
      <p className="font-mono font-bold text-sm">{value}</p>
    </div>
  );
}

function DeckCard({ deck, onPlay }: { deck: Deck; onPlay: () => void }) {
  return (
    <div className="universe-card border-2 border-black bg-white flex flex-col" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
      <Link href={`/decks/${deck.slug}`} className="border-b-2 border-black block" style={{ height: 165 }}>
        <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
      </Link>
      <div className="bg-black px-3 py-2 border-b-2 border-black">
        <h3 className="font-display text-white tracking-wider leading-tight" style={{ fontSize: "1.15rem" }}>{deck.name.toUpperCase()}</h3>
      </div>
      <div className="px-3 py-3 flex-1 flex flex-col justify-between">
        <div className="flex gap-3 text-[9px] text-grey-dark font-mono font-bold uppercase tracking-wider mb-4">
          <span>{deck.card_count ?? deck.cards?.length ?? 0} Cards</span>
          <span>{deck.stat_count ?? deck.stat_definitions?.length ?? 0} Stats</span>
        </div>
        <div className="flex gap-0 border-t-2 border-black -mx-3 -mb-3 mt-auto">
          <Link href={`/decks/${deck.slug}`} className="deck-btn-light flex-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-black">Details</Link>
          <button onClick={onPlay} className="deck-btn-dark flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider">Play</button>
        </div>
      </div>
    </div>
  );
}
