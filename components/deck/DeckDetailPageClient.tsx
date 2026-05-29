"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { CardImageFrame } from "@/components/deck/CardImageFrame";
import { RoomModal } from "@/components/room/RoomModal";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { formatStatValue } from "@/lib/utils/statFormat";
import type { Card, Deck, StatDefinition, Universe } from "@/types";

export function DeckDetailPageClient({ deck, universe }: { deck: Deck | null; universe: Universe | null }) {
  const [playOpen, setPlayOpen] = useState(false);

  const stats = useMemo(
    () => [...(deck?.stat_definitions ?? [])].sort((a, b) => a.display_order - b.display_order),
    [deck]
  );
  const rankStat = stats.find((s) => s.name.toLowerCase() === "rank") ?? stats[0];
  const cards = useMemo(() => {
    return [...(deck?.cards ?? [])].sort((a, b) => {
      const av = a.card_stats?.find((cs) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
      const bv = b.card_stats?.find((cs) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
      return Number(av) - Number(bv) || a.name.localeCompare(b.name);
    });
  }, [deck, rankStat?.id]);

  if (!deck) {
    return (
      <main className="min-h-screen px-4 sm:px-8 py-16 max-w-3xl mx-auto">
        <div className="panel-brutal p-10 text-center">
          <h1 className="font-display tracking-widest text-2xl mb-2">DECK NOT FOUND</h1>
          <p className="text-xs text-grey-dark mb-5">This deck is inactive, missing, or not assigned to an active universe.</p>
          <Link href="/decks" className="btn-brutal btn-primary px-4 py-2 text-xs">Back to Universes</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-5">
        <Link href={`/decks${universe ? `?universe=${universe.slug}` : ""}`} className="text-[10px] font-bold uppercase tracking-wider text-grey-dark hover:text-black">
          Back to {universe?.name ?? "universes"}
        </Link>
      </div>

      <section className="grid lg:grid-cols-[360px_1fr] gap-6 mb-8">
        <div className="border-2 border-black bg-white h-[420px]" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
          <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
        </div>

        <div className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
          <div className="bg-black text-white px-5 py-4 border-b-2 border-black">
            <p className="text-[9px] text-grey-mid uppercase tracking-[0.25em] mb-1">{universe?.name ?? "Universe"}</p>
            <h1 className="font-display tracking-widest leading-none" style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}>{deck.name.toUpperCase()}</h1>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-5">
              <MetaBox label="Cards" value={`${cards.length}/52`} ok={cards.length === 52} />
              <MetaBox label="Stats" value={`${stats.length}/8`} ok={stats.length === 8} />
              <MetaBox label="Status" value={deck.is_active ? "Active" : "Inactive"} ok={deck.is_active} />
            </div>

            <div className="border-2 border-black mb-5">
              <div className="bg-grey-light px-3 py-2 border-b-2 border-black">
                <p className="text-[10px] font-bold uppercase tracking-wider">Battle Stats</p>
              </div>
              <div className="grid sm:grid-cols-2">
                {stats.map((stat, index) => (
                  <div key={stat.id} className="px-3 py-2 border-b border-grey-light" style={{ borderRight: index % 2 === 0 ? "1px solid #e0e0da" : undefined }}>
                    <span className="text-[9px] uppercase tracking-wider text-grey-dark">{stat.display_name}</span>
                    {stat.is_inverse && <span className="ml-2 text-[8px] font-bold uppercase tracking-wider border border-black px-1">Lower wins</span>}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setPlayOpen(true)} className="btn-brutal btn-primary w-full py-4">
              Play This Deck
            </button>
          </div>
        </div>
      </section>

      <section className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
        <div className="bg-black text-white px-5 py-3 border-b-2 border-black">
          <h2 className="font-display tracking-widest text-xl">CARDS</h2>
          <p className="text-[9px] text-grey-mid uppercase tracking-wider">Sorted by rank/stat order</p>
        </div>
        <div className="grid gap-4 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {cards.map((card) => (
            <MiniCard key={card.id} card={card} stats={stats} />
          ))}
        </div>
      </section>

      {playOpen && <RoomModal deck={deck} onClose={() => setPlayOpen(false)} />}
    </main>
  );
}

function MetaBox({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`border-2 border-black px-3 py-2 ${ok ? "bg-white" : "bg-grey-light"}`}>
      <p className="text-[8px] uppercase tracking-wider text-grey-dark">{label}</p>
      <p className="font-mono font-bold text-sm">{value}</p>
    </div>
  );
}

function MiniCard({ card, stats }: { card: Card; stats: StatDefinition[] }) {
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const statValues = new Map(card.card_stats?.map((cs) => [cs.stat_definition_id, cs.value]) ?? []);

  return (
    <div className="border-2 border-black bg-white overflow-hidden" style={{ boxShadow: "3px 3px 0px #0a0a0a" }}>
      <CardImageFrame imageUrl={imageUrl} alt={card.name} fallbackText={card.name} className="w-full h-[160px] border-b-2 border-black" />
      <div className="bg-black px-3 py-1.5 border-b border-black">
        <p className="font-display text-white leading-tight" style={{ fontSize: "0.95rem" }}>{card.name}</p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {stats.map((stat, i) => (
          <div
            key={stat.id}
            className="flex flex-col px-2.5 py-1.5"
            style={{
              borderRight: i % 2 === 0 ? "1px solid #e0e0da" : undefined,
              borderBottom: i < stats.length - 2 ? "1px solid #e0e0da" : undefined,
            }}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-grey-dark">{stat.display_name}</span>
            <span className="font-mono text-sm font-bold text-black leading-tight mt-0.5">{formatStatValue(statValues.get(stat.id), stat)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
