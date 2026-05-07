"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { getDeckCoverUrl } from "@/lib/utils/imageUrl";

interface AdminDeck {
  id: string; name: string; slug: string; cover_image_url: string | null; is_active: boolean;
  stat_definitions: [{ count: number }]; cards: [{ count: number }];
}

export default function AdminDecksPage() {
  const [decks, setDecks] = useState<AdminDeck[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/decks");
    if (res.ok) setDecks(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleActive(deck: AdminDeck) {
    await fetch(`/api/admin/decks/${deck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !deck.is_active }),
    });
    load();
  }

  async function uploadCover(deck: AdminDeck, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", deck.slug);
    await fetch(`/api/admin/decks/${deck.id}/cover`, { method: "POST", body: fd });
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display tracking-widest text-3xl">DECKS</h1>
        <Link href="/admin/decks/new" className="btn-brutal btn-primary text-xs px-4 py-2">
          + New Deck
        </Link>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {decks.map(deck => (
          <div key={deck.id} className="border-2 border-black bg-white" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
            {/* Cover */}
            <div className="relative border-b-2 border-black" style={{ height: 140 }}>
              <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
              <label className="absolute bottom-2 right-2 cursor-pointer">
                <span className="text-[8px] font-bold uppercase tracking-wider bg-white border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
                  {getDeckCoverUrl(deck.cover_image_url, deck.slug) ? "Change Image" : "Upload Image"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (f) uploadCover(deck, f);
                }} />
              </label>
            </div>

            {/* Info */}
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display tracking-wider text-lg leading-tight">{deck.name.toUpperCase()}</p>
                  <p className="font-mono text-[9px] text-grey-dark mt-0.5">{deck.slug}</p>
                </div>
                <button
                  onClick={() => toggleActive(deck)}
                  className={`text-[7px] font-bold uppercase tracking-wider border px-2 py-1 flex-shrink-0 transition-colors ${deck.is_active ? "bg-black text-white border-black" : "bg-white text-grey-dark border-grey-mid"}`}
                >
                  {deck.is_active ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="flex gap-4 mt-2 text-[9px] text-grey-dark font-mono">
                <span>{(deck.cards as unknown as { count: number }[])?.[0]?.count ?? 0} cards</span>
                <span>{(deck.stat_definitions as unknown as { count: number }[])?.[0]?.count ?? 0} stats</span>
              </div>

              <div className="flex gap-2 mt-3">
                <Link
                  href={`/admin/decks/${deck.slug}`}
                  className="btn-brutal btn-secondary text-[9px] px-3 py-1.5 flex-1 text-center"
                >
                  Edit →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
