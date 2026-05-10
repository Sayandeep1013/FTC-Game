"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UniverseOption {
  id: string;
  name: string;
  slug: string;
}

export default function NewDeckPage() {
  const router = useRouter();
  const [universes, setUniverses] = useState<UniverseOption[]>([]);
  const [universeId, setUniverseId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [displayOrder, setDisplayOrder] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/universes")
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data) ? data : [];
        setUniverses(rows);
        if (rows[0]?.id) setUniverseId(rows[0].id);
      });
  }, []);

  function onNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, universe_id: universeId, display_order: displayOrder }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setSaving(false); return; }
    router.push(`/admin/decks/${slug}`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/decks" className="text-[10px] font-bold uppercase tracking-wider border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
          ← Back
        </Link>
        <h1 className="font-display tracking-widest text-2xl">NEW DECK</h1>
      </div>

      <form onSubmit={submit} className="border-2 border-black bg-white p-6" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
        <div className="mb-4">
          <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Universe</label>
          <select className="input-brutal text-sm" value={universeId} onChange={e => setUniverseId(e.target.value)} required>
            {universes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <p className="text-[8px] text-grey-mid mt-1">Users pick this universe first, then this deck.</p>
        </div>
        <div className="mb-4">
          <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Deck Name</label>
          <input
            className="input-brutal"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Ben 10 Alien Force"
            required
          />
        </div>
        <div className="grid sm:grid-cols-[1fr_110px] gap-3 mb-5">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Slug (URL key)</label>
            <input
              className="input-brutal font-mono"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="e.g. ben-10-alien-force"
              required
            />
            <p className="text-[8px] text-grey-mid mt-1">Lowercase, hyphens only.</p>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Order</label>
            <input
              type="number"
              className="input-brutal font-mono"
              value={displayOrder}
              onChange={e => setDisplayOrder(Number(e.target.value))}
            />
          </div>
        </div>
        {error && <p className="text-[10px] text-red-600 mb-3">{error}</p>}
        <button type="submit" disabled={saving || universes.length === 0} className="btn-brutal btn-primary w-full">
          {saving ? "Creating..." : "Create Deck →"}
        </button>
        <p className="text-[8px] text-grey-mid mt-3 text-center">
          New decks start inactive. Add 8 stats, 52 cards, and a cover before activating.
        </p>
      </form>
    </div>
  );
}
