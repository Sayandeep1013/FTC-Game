import { requireAdmin, db } from "@/lib/admin/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = db();
  const { data, error } = await supabase
    .from("decks")
    .select("*, universe:universes(id,name,slug), stat_definitions(count), cards(count)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    const { data: legacyDecks, error: legacyError } = await supabase
      .from("decks")
      .select("*, stat_definitions(count), cards(count)")
      .order("created_at", { ascending: false });

    if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });

    return NextResponse.json(
      (legacyDecks ?? []).map((deck) => ({
        ...deck,
        universe_id: `legacy-${deck.id}`,
        display_order: 10,
        universe: { id: `legacy-${deck.id}`, name: deck.name, slug: deck.slug },
        is_legacy: true,
      }))
    );
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { name, slug, universe_id, display_order = 0 } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  if (!universe_id) return NextResponse.json({ error: "Pick a universe before creating a deck" }, { status: 400 });

  const supabase = db();
  const { data, error } = await supabase
    .from("decks")
    .insert({ name, slug, universe_id, display_order, cover_image_url: "pending", is_active: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
