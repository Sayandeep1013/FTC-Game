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

  return NextResponse.json({ stats: stats ?? [], cards: cards ?? [] });
}

// POST — add cards. Body: { cards: [{ name, stats: { stat_name: value } }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const { cards } = await req.json() as { cards: { name: string; stats: Record<string, number> }[] };

  const supabase = db();
  const { data: statDefs } = await supabase
    .from("stat_definitions").select("id, name").eq("deck_id", id);

  const statNameToId: Record<string, string> = {};
  for (const s of statDefs ?? []) statNameToId[s.name] = s.id;

  const created = [];
  for (const card of cards) {
    const { data: newCard, error } = await supabase
      .from("cards")
      .insert({ deck_id: id, name: card.name, image_url: null, image_storage_path: null })
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

  return NextResponse.json({ created: created.length });
}
