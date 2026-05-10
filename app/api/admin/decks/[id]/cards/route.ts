import { requireAdmin, db } from "@/lib/admin/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all cards with their stats for a deck
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const supabase = db();

  const [{ data: stats }, { data: cards }] = await Promise.all([
    supabase.from("stat_definitions").select("*").eq("deck_id", id).order("display_order"),
    supabase.from("cards").select("*, card_stats(*)").eq("deck_id", id).order("name"),
  ]);

  const rankStat = (stats ?? []).find((s) => String(s.name).toLowerCase() === "rank") ?? (stats ?? [])[0];
  const sortedCards = [...(cards ?? [])].sort((a, b) => {
    const av = a.card_stats?.find((cs: { stat_definition_id: string }) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
    const bv = b.card_stats?.find((cs: { stat_definition_id: string }) => cs.stat_definition_id === rankStat?.id)?.value ?? Number.POSITIVE_INFINITY;
    return Number(av) - Number(bv) || String(a.name).localeCompare(String(b.name));
  });

  return NextResponse.json({ stats: stats ?? [], cards: sortedCards });
}

// POST — add cards. Body: { cards: [{ name, stats: { stat_name: value } }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const { cards, replace = false } = await req.json() as { cards: { name: string; stats: Record<string, number> }[]; replace?: boolean };

  const supabase = db();
  const { data: statDefs } = await supabase
    .from("stat_definitions").select("id, name").eq("deck_id", id);

  const statNameToId: Record<string, string> = {};
  for (const s of statDefs ?? []) statNameToId[s.name] = s.id;

  if (replace) {
    const { data: existing } = await supabase.from("cards").select("id").eq("deck_id", id);
    const ids = (existing ?? []).map((c) => c.id);
    if (ids.length > 0) await supabase.from("card_stats").delete().in("card_id", ids);
    await supabase.from("cards").delete().eq("deck_id", id);
  }

  const created = [];
  const skipped: string[] = [];
  for (const card of cards) {
    if (!card.name?.trim()) {
      skipped.push("(blank name)");
      continue;
    }
    const { data: newCard, error } = await supabase
      .from("cards")
      .insert({ deck_id: id, name: card.name.trim(), image_url: null, image_storage_path: null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const cardStatRows = Object.entries(card.stats ?? {})
      .filter(([name]) => statNameToId[name])
      .map(([name, value]) => ({
        card_id: newCard.id,
        stat_definition_id: statNameToId[name],
        value: Number(value),
      }));

    if (cardStatRows.length > 0) {
      await supabase.from("card_stats").insert(cardStatRows);
    }
    created.push(newCard);
  }

  return NextResponse.json({ created: created.length, skipped });
}
