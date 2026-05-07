"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewDeckPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      body: JSON.stringify({ name, slug }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setSaving(false); return; }
    router.push(`/admin/decks/${slug}`);
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/decks" className="text-[10px] font-bold uppercase tracking-wider border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
          ← Back
        </Link>
        <h1 className="font-display tracking-widest text-2xl">NEW DECK</h1>
      </div>

      <form onSubmit={submit} className="border-2 border-black p-6" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
        <div className="mb-4">
          <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Deck Name</label>
          <input
            className="input-brutal"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Marvel Heroes"
            required
          />
        </div>
        <div className="mb-5">
          <label className="text-[9px] font-bold uppercase tracking-wider text-grey-dark block mb-1">Slug (URL key)</label>
          <input
            className="input-brutal font-mono"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="e.g. marvel-heroes"
            required
          />
          <p className="text-[8px] text-grey-mid mt-1">Auto-generated · lowercase, hyphens only</p>
        </div>
        {error && <p className="text-[10px] text-red-600 mb-3">{error}</p>}
        <button type="submit" disabled={saving} className="btn-brutal btn-primary w-full">
          {saving ? "Creating..." : "Create Deck →"}
        </button>
        <p className="text-[8px] text-grey-mid mt-3 text-center">
          After creating, you&apos;ll add stats and cards in the next step.
        </p>
      </form>
    </div>
  );
}
