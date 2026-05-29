"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { compressImageForUpload } from "@/lib/utils/compressImage";
import { formatStatValue, heightPartsFromValue, heightValueFromParts, type StatValueFormat } from "@/lib/utils/statFormat";

interface StatDef { id: string; name: string; display_name: string; unit_label: string; value_format: StatValueFormat; is_inverse: boolean; display_order: number; }
interface CardStat { stat_definition_id: string; value: number; }
interface AdminCard { id: string; name: string; image_url: string | null; image_storage_path: string | null; card_stats: CardStat[]; }
interface AdminUniverse { id: string; name: string; slug: string; }
interface AdminDeckSummary { id: string; name: string; slug: string; universe_id: string | null; display_order: number; is_active: boolean; universe?: AdminUniverse | null; }

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      i++;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function defaultStatMeta(name: string): { unit_label: string; value_format: StatValueFormat } {
  switch (name.toLowerCase().trim()) {
    case "height":
      return { unit_label: "ft/in", value_format: "height_ft_in" };
    case "weight":
      return { unit_label: "kg", value_format: "unit" };
    case "speed":
      return { unit_label: "km/h", value_format: "unit" };
    default:
      return { unit_label: "", value_format: "number" };
  }
}

export default function DeckEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [deckId, setDeckId] = useState<string>("");
  const [deckName, setDeckName] = useState("");
  const [deck, setDeck] = useState<AdminDeckSummary | null>(null);
  const [universes, setUniverses] = useState<AdminUniverse[]>([]);
  const [stats, setStats] = useState<StatDef[]>([]);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "cards">("stats");

  const load = useCallback(async () => {
    // Fetch deck info
    const [dr, ur] = await Promise.all([fetch("/api/admin/decks"), fetch("/api/admin/universes")]);
    const decks = await dr.json();
    const universeData = await ur.json();
    const universeRows = Array.isArray(universeData) ? universeData : [];
    const current = decks.find((d: AdminDeckSummary) => d.slug === slug);
    if (!current) return;
    setDeck(current);
    setUniverses(universeRows ?? []);
    setDeckId(current.id);
    setDeckName(current.name);

    const cr = await fetch(`/api/admin/decks/${current.id}/cards`);
    const { stats: s, cards: c } = await cr.json();
    setStats(s);
    setCards(c);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-5">
        <Link href="/admin/decks" className="text-[10px] font-bold uppercase tracking-wider border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
          ← Back
        </Link>
        <h1 className="font-display tracking-widest text-2xl">{deckName.toUpperCase()}</h1>
        <span className="font-mono text-[9px] text-grey-dark">{stats.length} stats · {cards.length} cards</span>
      </div>

      {deck && <DeckSettings deck={deck} universes={universes} onRefresh={load} />}

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-6">
        {(["stats", "cards"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider border-r border-black transition-colors ${tab === t ? "bg-black text-white" : "bg-white text-grey-dark hover:bg-grey-light"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsEditor deckId={deckId} stats={stats} onRefresh={load} />}
      {tab === "cards" && <CardsEditor deckId={deckId} deckSlug={slug} stats={stats} cards={cards} onRefresh={load} />}
    </div>
  );
}

// ── Stats editor ──────────────────────────────────────────────────────────────

function DeckSettings({ deck, universes, onRefresh }: { deck: AdminDeckSummary; universes: AdminUniverse[]; onRefresh: () => void }) {
  const [draft, setDraft] = useState({
    name: deck.name,
    slug: deck.slug,
    universe_id: deck.universe_id ?? "",
    display_order: deck.display_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      name: deck.name,
      slug: deck.slug,
      universe_id: deck.universe_id ?? "",
      display_order: deck.display_order ?? 0,
    });
  }, [deck]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/decks/${deck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      alert((await res.json()).error ?? "Could not save deck settings");
      return;
    }
    onRefresh();
  }

  return (
    <div className="border-2 border-black bg-white p-4 mb-5" style={{ boxShadow: "3px 3px 0 #0a0a0a" }}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark mb-3">Deck Settings</p>
      <div className="grid md:grid-cols-[1fr_1fr_1fr_100px_auto] gap-3 items-end">
        <label className="block">
          <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Universe</span>
          <select className="input-brutal text-xs" value={draft.universe_id} onChange={e => setDraft(d => ({ ...d, universe_id: e.target.value }))}>
            <option value="">No universe</option>
            {universes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Deck Name</span>
          <input className="input-brutal text-xs" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
        </label>
        <label className="block">
          <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Slug</span>
          <input className="input-brutal text-xs font-mono" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} />
        </label>
        <label className="block">
          <span className="text-[8px] uppercase tracking-wider text-grey-dark block mb-1">Order</span>
          <input type="number" className="input-brutal text-xs font-mono" value={draft.display_order} onChange={e => setDraft(d => ({ ...d, display_order: Number(e.target.value) }))} />
        </label>
        <button onClick={save} disabled={saving} className="btn-brutal btn-primary text-[9px] px-3 py-2">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function StatsEditor({ deckId, stats, onRefresh }: { deckId: string; stats: StatDef[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Record<string, Partial<StatDef>>>({});
  const [adding, setAdding] = useState(false);
  const [newStat, setNewStat] = useState({ name: "", display_name: "", unit_label: "", value_format: "number" as StatValueFormat, is_inverse: false, display_order: stats.length + 1 });
  const [saving, setSaving] = useState(false);

  async function saveStat(stat: StatDef) {
    const patch = editing[stat.id] ?? {};
    await fetch(`/api/admin/decks/${deckId}/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat_id: stat.id, ...patch }),
    });
    setEditing(e => { const n = { ...e }; delete n[stat.id]; return n; });
    onRefresh();
  }

  async function deleteStat(statId: string) {
    if (!confirm("Delete this stat? Card values for this stat will also be removed.")) return;
    await fetch(`/api/admin/decks/${deckId}/stats`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat_id: statId }),
    });
    onRefresh();
  }

  async function addStat(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(`/api/admin/decks/${deckId}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([newStat]),
    });
    setAdding(false);
    setNewStat({ name: "", display_name: "", unit_label: "", value_format: "number", is_inverse: false, display_order: stats.length + 2 });
    setSaving(false);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-grey-dark uppercase tracking-wider">Stat definitions for this deck ({stats.length}/8)</p>
        {stats.length < 8 && <button onClick={() => setAdding(true)} className="btn-brutal btn-primary text-[9px] px-3 py-1.5">+ Add Stat</button>}
      </div>

      <div className="border-2 border-black" style={{ boxShadow: "4px 4px 0 #0a0a0a" }}>
        {/* Header row */}
        <div className="grid bg-black text-white text-[8px] font-bold uppercase tracking-wider" style={{ gridTemplateColumns: "40px 1fr 1fr 90px 110px 80px 60px 80px" }}>
          <div className="px-3 py-2 border-r border-grey-dark">#</div>
          <div className="px-3 py-2 border-r border-grey-dark">Internal Name</div>
          <div className="px-3 py-2 border-r border-grey-dark">Display Name</div>
          <div className="px-3 py-2 border-r border-grey-dark">Unit</div>
          <div className="px-3 py-2 border-r border-grey-dark">Format</div>
          <div className="px-3 py-2 border-r border-grey-dark text-center">Lower Wins</div>
          <div className="px-3 py-2 border-r border-grey-dark text-center">Order</div>
          <div className="px-3 py-2 text-center">Actions</div>
        </div>

        {stats.map((stat, i) => {
          const e = editing[stat.id] ?? {};
          const changed = Object.keys(e).length > 0;
          return (
            <div key={stat.id} className={`grid border-t border-grey-light text-sm ${i % 2 === 0 ? "bg-white" : "bg-grey-light"}`} style={{ gridTemplateColumns: "40px 1fr 1fr 90px 110px 80px 60px 80px" }}>
              <div className="px-3 py-2 border-r border-grey-light font-mono text-[10px] text-grey-dark flex items-center">{stat.display_order}</div>
              <div className="px-2 py-1 border-r border-grey-light">
                <input className="w-full text-xs font-mono bg-transparent outline-none border-b border-transparent focus:border-black px-1" defaultValue={stat.name} onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], name: v.target.value } }))} />
              </div>
              <div className="px-2 py-1 border-r border-grey-light">
                <input className="w-full text-xs bg-transparent outline-none border-b border-transparent focus:border-black px-1" defaultValue={stat.display_name} onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], display_name: v.target.value } }))} />
              </div>
              <div className="px-2 py-1 border-r border-grey-light">
                <input className="w-full text-xs bg-transparent outline-none border-b border-transparent focus:border-black px-1" defaultValue={stat.unit_label ?? ""} placeholder="kg" onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], unit_label: v.target.value } }))} />
              </div>
              <div className="px-2 py-1 border-r border-grey-light">
                <select className="w-full text-[10px] bg-transparent outline-none border-b border-transparent focus:border-black px-1" defaultValue={stat.value_format ?? "number"} onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], value_format: v.target.value as StatValueFormat } }))}>
                  <option value="number">Number</option>
                  <option value="unit">Unit</option>
                  <option value="height_ft_in">Ft/In</option>
                </select>
              </div>
              <div className="px-3 py-2 border-r border-grey-light flex items-center justify-center">
                <input type="checkbox" defaultChecked={stat.is_inverse} onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], is_inverse: v.target.checked } }))} />
              </div>
              <div className="px-2 py-1 border-r border-grey-light">
                <input type="number" className="w-full text-xs font-mono bg-transparent outline-none border-b border-transparent focus:border-black px-1 text-center" defaultValue={stat.display_order} onChange={v => setEditing(e2 => ({ ...e2, [stat.id]: { ...e2[stat.id], display_order: Number(v.target.value) } }))} />
              </div>
              <div className="px-2 py-2 flex items-center justify-center gap-1">
                {changed && <button onClick={() => saveStat(stat)} className="text-[8px] font-bold uppercase bg-black text-white px-2 py-1 hover:opacity-80">Save</button>}
                <button onClick={() => deleteStat(stat.id)} className="text-[8px] text-grey-dark hover:text-black">✕</button>
              </div>
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="px-4 py-8 text-center text-[10px] text-grey-mid uppercase tracking-wider border-t border-grey-light">
            No stats yet — add up to 8 stat definitions
          </div>
        )}
      </div>

      {/* Add stat form */}
      {adding && (
        <form onSubmit={addStat} className="mt-4 border-2 border-black p-4" style={{ boxShadow: "3px 3px 0 #0a0a0a" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-3">New Stat</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Internal Name <span className="text-grey-mid">(e.g. strength)</span></label>
              <input className="input-brutal text-xs font-mono" value={newStat.name} onChange={e => {
                const name = e.target.value.toLowerCase().replace(/\s+/g, "_");
                setNewStat(s => ({ ...s, name, ...defaultStatMeta(name) }));
              }} required placeholder="strength" />
            </div>
            <div>
              <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Display Name <span className="text-grey-mid">(e.g. Strength)</span></label>
              <input className="input-brutal text-xs" value={newStat.display_name} onChange={e => setNewStat(s => ({ ...s, display_name: e.target.value }))} required placeholder="Strength" />
            </div>
            <div>
              <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Unit <span className="text-grey-mid">(e.g. kg)</span></label>
              <input className="input-brutal text-xs font-mono" value={newStat.unit_label} onChange={e => setNewStat(s => ({ ...s, unit_label: e.target.value }))} placeholder="kg" />
            </div>
            <div>
              <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Value Format</label>
              <select className="input-brutal text-xs" value={newStat.value_format} onChange={e => setNewStat(s => ({ ...s, value_format: e.target.value as StatValueFormat }))}>
                <option value="number">Number</option>
                <option value="unit">Number + Unit</option>
                <option value="height_ft_in">Height: ft/in</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={newStat.is_inverse} onChange={e => setNewStat(s => ({ ...s, is_inverse: e.target.checked }))} />
              Lower value wins (e.g. Rank)
            </label>
            <label className="flex items-center gap-2 text-xs">
              Order:
              <input type="number" className="input-brutal w-16 text-xs font-mono py-1" value={newStat.display_order} onChange={e => setNewStat(s => ({ ...s, display_order: Number(e.target.value) }))} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-brutal btn-primary text-xs px-4 py-2">{saving ? "Adding..." : "Add Stat"}</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-brutal btn-secondary text-xs px-4 py-2">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Cards editor ──────────────────────────────────────────────────────────────

function CardsEditor({ deckId, deckSlug, stats, cards, onRefresh }: {
  deckId: string; deckSlug: string; stats: StatDef[]; cards: AdminCard[]; onRefresh: () => void;
}) {
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setCsvError("");
    const text = await file.text();
    const lines = text.replace(/\r/g, "").trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { setCsvError("CSV must have a header row + at least one card."); setImporting(false); return; }

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const nameIdx = headers.indexOf("name");
    if (nameIdx === -1) { setCsvError("CSV must have a 'name' column."); setImporting(false); return; }

    const statNameToIdx: Record<string, number> = {};
    for (const stat of stats) {
      const idx = headers.indexOf(stat.name.toLowerCase());
      if (idx !== -1) statNameToIdx[stat.name] = idx;
    }

    const cardRows = lines.slice(1).map(line => {
      const cols = parseCsvLine(line);
      const statVals: Record<string, number> = {};
      for (const [sName, idx] of Object.entries(statNameToIdx)) {
        statVals[sName] = Number(cols[idx]) || 0;
      }
      return { name: cols[nameIdx], stats: statVals };
    });

    const res = await fetch(`/api/admin/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: cardRows }),
    });
    if (!res.ok) setCsvError((await res.json()).error ?? "Import failed");
    else { setImporting(false); onRefresh(); }
    if (fileRef.current) fileRef.current.value = "";
    setImporting(false);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={() => setShowAddForm(v => !v)} className="btn-brutal btn-primary text-[9px] px-3 py-1.5">
          + Add Card
        </button>
        <label className="cursor-pointer">
          <span className="btn-brutal btn-secondary text-[9px] px-3 py-1.5 inline-flex items-center gap-1.5">
            {importing ? "Importing..." : "Import CSV"}
          </span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} disabled={importing} />
        </label>
        <a
          href={`data:text/plain,name,${stats.map(s => s.name).join(",")}\n"Example Card",${stats.map(() => "0").join(",")}`}
          download={`${deckSlug}-template.csv`}
          className="text-[8px] font-bold uppercase tracking-wider text-grey-dark underline hover:text-black"
        >
          Download CSV Template
        </a>
        {csvError && <p className="text-[9px] text-red-600">{csvError}</p>}
      </div>

      {showAddForm && <AddCardForm deckId={deckId} stats={stats} onDone={() => { setShowAddForm(false); onRefresh(); }} />}

      {/* Card grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {cards.map(card => (
          <CardTile
            key={card.id}
            card={card}
            stats={stats}
            deckSlug={deckSlug}
            onEdit={() => setEditingCard(card)}
            onDelete={async () => {
              if (!confirm(`Delete "${card.name}"?`)) return;
              await fetch(`/api/admin/cards/${card.id}`, { method: "DELETE" });
              onRefresh();
            }}
            onRefresh={onRefresh}
          />
        ))}
        {cards.length === 0 && (
          <p className="col-span-full text-center text-[10px] text-grey-mid uppercase tracking-wider py-10">
            No cards yet — add manually or import a CSV
          </p>
        )}
      </div>

      {/* Edit modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          stats={stats}
          deckSlug={deckSlug}
          onClose={() => { setEditingCard(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function CardTile({ card, stats, deckSlug, onEdit, onDelete, onRefresh }: {
  card: AdminCard; stats: StatDef[]; deckSlug: string;
  onEdit: () => void; onDelete: () => void; onRefresh: () => void;
}) {
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const statMap: Record<string, number> = {};
  for (const cs of card.card_stats) statMap[cs.stat_definition_id] = cs.value;

  async function uploadImage(file: File) {
    const uploadFile = await compressImageForUpload(file);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("deck_slug", deckSlug);
    fd.append("card_name", card.name);
    const res = await fetch(`/api/admin/cards/${card.id}`, { method: "PATCH", body: fd });
    if (!res.ok) {
      alert((await res.json()).error ?? "Image upload failed");
      return;
    }
    onRefresh();
  }

  return (
    <div className="border-2 border-black bg-white overflow-hidden" style={{ boxShadow: "3px 3px 0 #0a0a0a" }}>
      {/* Image */}
      <div className="relative border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden" style={{ height: 90 }}>
        {imageUrl
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
          )
          : <span className="font-display text-grey-dark text-2xl">{card.name[0]?.toUpperCase()}</span>
        }
        <label className="absolute bottom-1 right-1 cursor-pointer">
          <span className="text-[7px] font-bold uppercase bg-white border border-black px-1.5 py-0.5 hover:bg-black hover:text-white transition-colors">
            {imageUrl ? "Change" : "Upload"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
        </label>
      </div>

      {/* Name */}
      <div className="bg-black px-2 py-1 border-b border-black">
        <p className="font-display text-white text-[11px] leading-tight truncate">{card.name.toUpperCase()}</p>
      </div>

      {/* Stat quick view */}
      <div className="px-2 py-1.5">
        {stats.slice(0, 4).map(s => (
          <div key={s.id} className="flex justify-between text-[8px]">
            <span className="text-grey-dark uppercase tracking-wide">{s.display_name}</span>
            <span className="font-mono font-bold">{formatStatValue(statMap[s.id], s)}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex border-t border-grey-light">
        <button onClick={onEdit} className="flex-1 py-1.5 text-[8px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors border-r border-grey-light">Edit</button>
        <button onClick={onDelete} className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider text-grey-dark hover:bg-black hover:text-white transition-colors">✕</button>
      </div>
    </div>
  );
}

function AddCardForm({ deckId, stats, onDone }: { deckId: string; stats: StatDef[]; onDone: () => void }) {
  const [name, setName] = useState("");
  const [statVals, setStatVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const statsPayload: Record<string, number> = {};
    for (const s of stats) statsPayload[s.name] = Number(statVals[s.name] ?? 0);
    await fetch(`/api/admin/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: [{ name, stats: statsPayload }] }),
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="border-2 border-black p-4 mb-4" style={{ boxShadow: "3px 3px 0 #0a0a0a" }}>
      <p className="text-[9px] font-bold uppercase tracking-wider mb-3">Add New Card</p>
      <div className="mb-3">
        <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Card Name</label>
        <input className="input-brutal text-sm" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Batman" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {stats.map(s => (
          <StatValueInput
            key={s.id}
            stat={s}
            value={statVals[s.name] ?? ""}
            onChange={value => setStatVals(v => ({ ...v, [s.name]: value }))}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-brutal btn-primary text-xs px-4 py-2">{saving ? "Saving..." : "Add Card"}</button>
        <button type="button" onClick={onDone} className="btn-brutal btn-secondary text-xs px-4 py-2">Cancel</button>
      </div>
    </form>
  );
}

function StatValueInput({ stat, value, onChange, note }: {
  stat: StatDef;
  value: string;
  onChange: (value: string) => void;
  note?: string;
}) {
  const label = (
    <label className="text-[7px] text-grey-dark uppercase tracking-wider block mb-0.5">
      {stat.display_name}
      {stat.unit_label && stat.value_format !== "height_ft_in" && <span className="text-grey-mid"> ({stat.unit_label})</span>}
      {note && <span className="text-grey-mid"> ({note})</span>}
    </label>
  );

  if (stat.value_format === "height_ft_in") {
    const parts = heightPartsFromValue(value);
    return (
      <div>
        {label}
        <div className="grid grid-cols-2 gap-1">
          <label className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              className="input-brutal text-xs font-mono py-1"
              value={parts.feet}
              onChange={e => onChange(String(heightValueFromParts(e.target.value, parts.inches)))}
              placeholder="ft"
            />
            <span className="text-[8px] font-bold uppercase text-grey-dark">ft</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={11}
              className="input-brutal text-xs font-mono py-1"
              value={parts.inches}
              onChange={e => onChange(String(heightValueFromParts(parts.feet, e.target.value)))}
              placeholder="in"
            />
            <span className="text-[8px] font-bold uppercase text-grey-dark">in</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type="number"
        className="input-brutal text-xs font-mono py-1"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  );
}

function CardEditModal({ card, stats, deckSlug, onClose }: {
  card: AdminCard; stats: StatDef[]; deckSlug: string; onClose: () => void;
}) {
  const [name, setName] = useState(card.name);
  const statDefMap: Record<string, number> = {};
  for (const cs of card.card_stats) statDefMap[cs.stat_definition_id] = cs.value;
  const [statVals, setStatVals] = useState<Record<string, string>>(
    Object.fromEntries(stats.map(s => [s.id, String(statDefMap[s.id] ?? "")]))
  );
  const [imageUrl, setImageUrl] = useState(() => getCardImageUrl(card.image_url, card.image_storage_path));
  const objectUrlRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function save() {
    setSaving(true);
    const statsPayload: Record<string, number> = {};
    for (const s of stats) statsPayload[s.id] = Number(statVals[s.id] ?? 0);
    await fetch(`/api/admin/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stats: statsPayload }),
    });
    onClose();
  }

  async function uploadImage(file: File) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setImageUrl(objectUrlRef.current);

    const uploadFile = await compressImageForUpload(file);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("deck_slug", deckSlug);
    fd.append("card_name", name);
    const res = await fetch(`/api/admin/cards/${card.id}`, { method: "PATCH", body: fd });
    if (!res.ok) {
      alert((await res.json()).error ?? "Image upload failed");
      setImageUrl(getCardImageUrl(card.image_url, card.image_storage_path));
      return;
    }

    const data = await res.json();
    if (typeof data.path === "string") {
      setImageUrl(getCardImageUrl(null, data.path, Date.now()));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel-brutal w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-black border-b-2 border-black">
          <span className="font-display text-white tracking-wider text-lg">EDIT CARD</span>
          <button onClick={onClose} className="w-7 h-7 border border-white text-white flex items-center justify-center text-sm hover:bg-white hover:text-black transition-colors">✕</button>
        </div>

        <div className="p-5">
          {/* Image upload */}
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-24 border-2 border-black bg-grey-light flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl
                ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={name} className="w-full h-full object-contain p-1" />
                )
                : <span className="font-display text-grey-dark text-2xl">{name[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="flex-1">
              <label className="text-[8px] text-grey-dark uppercase tracking-wider block mb-1">Card Name</label>
              <input className="input-brutal text-sm mb-2" value={name} onChange={e => setName(e.target.value)} />
              <label className="cursor-pointer inline-block">
                <span className="text-[8px] font-bold uppercase tracking-wider border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
                  {imageUrl ? "Change Image" : "Upload Image"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              </label>
            </div>
          </div>

          {/* Stat values */}
          <p className="text-[8px] font-bold uppercase tracking-wider text-grey-dark mb-2">Stat Values</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {stats.map(s => (
              <StatValueInput
                key={s.id}
                stat={s}
                value={statVals[s.id] ?? ""}
                onChange={value => setStatVals(v => ({ ...v, [s.id]: value }))}
                note={s.is_inverse ? "lower wins" : undefined}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-brutal btn-primary flex-1 text-xs py-2">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={onClose} className="btn-brutal btn-secondary px-4 text-xs py-2">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
