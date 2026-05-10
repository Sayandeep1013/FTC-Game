"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DeckCoverArt } from "@/components/deck/DeckCoverArt";
import { getDeckCoverUrl } from "@/lib/utils/imageUrl";

interface AdminUniverse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface AdminDeck {
  id: string;
  universe_id: string | null;
  name: string;
  slug: string;
  cover_image_url: string | null;
  is_active: boolean;
  display_order: number;
  universe?: { id: string; name: string; slug: string } | null;
  stat_definitions: [{ count: number }];
  cards: [{ count: number }];
}

export default function AdminDecksPage() {
  const [universes, setUniverses] = useState<AdminUniverse[]>([]);
  const [decks, setDecks] = useState<AdminDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUniverse, setNewUniverse] = useState({ name: "", slug: "", description: "" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [ur, dr] = await Promise.all([
      fetch("/api/admin/universes"),
      fetch("/api/admin/decks"),
    ]);
    if (ur.ok) {
      const data = await ur.json();
      setUniverses(Array.isArray(data) ? data : []);
    }
    if (dr.ok) {
      const data = await dr.json();
      setDecks(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const orphanDecks = decks.filter(d => !d.universe_id);
  const grouped = useMemo(() => {
    return universes.map(universe => ({
      universe,
      decks: decks
        .filter(deck => deck.universe_id === universe.id)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)),
    }));
  }, [universes, decks]);

  function onUniverseName(v: string) {
    setNewUniverse({
      ...newUniverse,
      name: v,
      slug: v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    });
  }

  async function addUniverse(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/universes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUniverse),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create universe");
      return;
    }
    setNewUniverse({ name: "", slug: "", description: "" });
    load();
  }

  async function updateUniverse(id: string, updates: Partial<AdminUniverse>) {
    const res = await fetch(`/api/admin/universes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? "Could not update universe");
      return;
    }
    load();
  }

  async function toggleActive(deck: AdminDeck) {
    const cardCount = getCount(deck.cards);
    const statCount = getCount(deck.stat_definitions);
    if (!deck.is_active && (cardCount !== 52 || statCount !== 8)) {
      const ok = confirm(
        `This deck has ${cardCount}/52 cards and ${statCount}/8 stats.\n\nActivate anyway? Players may see an unfinished deck.`
      );
      if (!ok) return;
    }

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
    const res = await fetch(`/api/admin/decks/${deck.id}/cover`, { method: "POST", body: fd });
    if (!res.ok) alert((await res.json()).error ?? "Cover upload failed");
    load();
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-grey-dark font-bold mb-1">Universe → Deck → Cards</p>
          <h1 className="font-display tracking-widest text-3xl">UNIVERSES</h1>
        </div>
        <Link href="/admin/decks/new" className="btn-brutal btn-primary text-xs px-4 py-2">
          + New Deck
        </Link>
      </div>

      <form onSubmit={addUniverse} className="border-2 border-black bg-white p-4 mb-6" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3">Add Universe</p>
        <div className="grid sm:grid-cols-[1fr_1fr_2fr_auto] gap-3">
          <input className="input-brutal text-sm" placeholder="Universe name e.g. Ben 10" value={newUniverse.name} onChange={e => onUniverseName(e.target.value)} required />
          <input className="input-brutal text-sm font-mono" placeholder="slug" value={newUniverse.slug} onChange={e => setNewUniverse(u => ({ ...u, slug: e.target.value }))} required />
          <input className="input-brutal text-sm" placeholder="Short description" value={newUniverse.description} onChange={e => setNewUniverse(u => ({ ...u, description: e.target.value }))} />
          <button className="btn-brutal btn-secondary text-xs px-4">Add</button>
        </div>
        {error && <p className="text-[10px] text-red-600 mt-2">{error}</p>}
      </form>

      {orphanDecks.length > 0 && (
        <div className="border-2 border-black bg-white p-4 mb-6" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2">Needs universe assignment</p>
          <div className="flex flex-wrap gap-2">
            {orphanDecks.map(deck => <Link key={deck.id} href={`/admin/decks/${deck.slug}`} className="text-xs underline">{deck.name}</Link>)}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {grouped.map(({ universe, decks }) => (
          <section key={universe.id} className="border-2 border-black bg-white" style={{ boxShadow: "5px 5px 0 #0a0a0a" }}>
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-black text-white border-b-2 border-black">
              <div>
                <h2 className="font-display tracking-widest text-xl">{universe.name.toUpperCase()}</h2>
                <p className="text-[9px] text-grey-mid uppercase tracking-wider">{universe.description || `${decks.length} deck(s)`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px]">{decks.length} decks</span>
                <button
                  onClick={() => updateUniverse(universe.id, { is_active: !universe.is_active })}
                  className={`text-[7px] font-bold uppercase tracking-wider border px-2 py-1 flex-shrink-0 transition-colors ${universe.is_active ? "bg-white text-black border-white" : "bg-black text-white border-white"}`}
                >
                  {universe.is_active ? "Public" : "Hidden"}
                </button>
              </div>
            </div>
            <UniverseSettings universe={universe} onSave={updates => updateUniverse(universe.id, updates)} />

            {decks.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-grey-mid">No decks in this universe yet.</div>
            ) : (
              <div className="grid gap-4 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {decks.map(deck => (
                  <DeckAdminCard key={deck.id} deck={deck} onToggle={() => toggleActive(deck)} onUpload={file => uploadCover(deck, file)} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function UniverseSettings({ universe, onSave }: { universe: AdminUniverse; onSave: (updates: Partial<AdminUniverse>) => void }) {
  const [draft, setDraft] = useState({
    name: universe.name,
    slug: universe.slug,
    description: universe.description ?? "",
    display_order: universe.display_order ?? 0,
  });

  useEffect(() => {
    setDraft({
      name: universe.name,
      slug: universe.slug,
      description: universe.description ?? "",
      display_order: universe.display_order ?? 0,
    });
  }, [universe]);

  return (
    <div className="grid md:grid-cols-[1fr_1fr_2fr_100px_auto] gap-3 p-4 border-b-2 border-black bg-grey-light items-end">
      <label className="block">
        <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Name</span>
        <input className="input-brutal text-xs bg-white" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Slug</span>
        <input className="input-brutal text-xs bg-white font-mono" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Description</span>
        <input className="input-brutal text-xs bg-white" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
      </label>
      <label className="block">
        <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Order</span>
        <input type="number" className="input-brutal text-xs bg-white font-mono" value={draft.display_order} onChange={e => setDraft(d => ({ ...d, display_order: Number(e.target.value) }))} />
      </label>
      <button onClick={() => onSave(draft)} className="btn-brutal btn-secondary text-[9px] px-3 py-2">
        Save
      </button>
    </div>
  );
}

function DeckAdminCard({ deck, onToggle, onUpload }: { deck: AdminDeck; onToggle: () => void; onUpload: (file: File) => void }) {
  const cardCount = getCount(deck.cards);
  const statCount = getCount(deck.stat_definitions);
  const ready = cardCount === 52 && statCount === 8 && !!getDeckCoverUrl(deck.cover_image_url, deck.slug);

  return (
    <div className="border-2 border-black bg-white" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
      <div className="relative border-b-2 border-black" style={{ height: 140 }}>
        <DeckCoverArt slug={deck.slug} name={deck.name} coverImageUrl={deck.cover_image_url} className="w-full h-full" />
        <label className="absolute bottom-2 right-2 cursor-pointer">
          <span className="text-[8px] font-bold uppercase tracking-wider bg-white border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
            {getDeckCoverUrl(deck.cover_image_url, deck.slug) ? "Change Image" : "Upload Image"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]; if (f) onUpload(f);
          }} />
        </label>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display tracking-wider text-lg leading-tight">{deck.name.toUpperCase()}</p>
            <p className="font-mono text-[9px] text-grey-dark mt-0.5">{deck.slug}</p>
          </div>
          <button
            onClick={onToggle}
            className={`text-[7px] font-bold uppercase tracking-wider border px-2 py-1 flex-shrink-0 transition-colors ${deck.is_active ? "bg-black text-white border-black" : "bg-white text-grey-dark border-grey-mid"}`}
          >
            {deck.is_active ? "Active" : "Inactive"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <HealthPill label="Cards" value={`${cardCount}/52`} ok={cardCount === 52} />
          <HealthPill label="Stats" value={`${statCount}/8`} ok={statCount === 8} />
          <HealthPill label="Cover" value={getDeckCoverUrl(deck.cover_image_url, deck.slug) ? "OK" : "Missing"} ok={!!getDeckCoverUrl(deck.cover_image_url, deck.slug)} />
        </div>

        {!ready && (
          <p className="mt-3 text-[9px] leading-relaxed text-grey-dark border border-black bg-grey-light px-2 py-1.5">
            Not production-ready yet. Keep inactive until cards, stats, and cover are complete.
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <Link href={`/admin/decks/${deck.slug}`} className="btn-brutal btn-secondary text-[9px] px-3 py-1.5 flex-1 text-center">
            Edit →
          </Link>
        </div>
      </div>
    </div>
  );
}

function HealthPill({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`border px-2 py-1 ${ok ? "border-black bg-white" : "border-black bg-grey-light"}`}>
      <p className="text-[7px] uppercase tracking-wider text-grey-dark">{label}</p>
      <p className="font-mono text-[10px] font-bold">{value}</p>
    </div>
  );
}

function getCount(v: [{ count: number }] | unknown): number {
  return (v as { count: number }[])?.[0]?.count ?? 0;
}
