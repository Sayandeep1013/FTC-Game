import { requireAdmin, db } from "@/lib/admin/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = db();
  const { data, error } = await supabase
    .from("universes")
    .select("*, decks(count)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    const { data: decks, error: deckError } = await supabase
      .from("decks")
      .select("id, name, slug, cover_image_url, is_active, created_at")
      .order("name", { ascending: true });

    if (deckError) return NextResponse.json({ error: deckError.message }, { status: 500 });

    return NextResponse.json(
      (decks ?? []).map((deck, index) => ({
        id: `legacy-${deck.id}`,
        name: deck.name,
        slug: deck.slug,
        description: "Temporary legacy universe. Run migration 004 to persist this.",
        cover_image_url: deck.cover_image_url,
        is_active: deck.is_active,
        display_order: (index + 1) * 10,
        created_at: deck.created_at,
        decks: [{ count: 1 }],
        is_legacy: true,
      }))
    );
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { name, slug, description = "", display_order = 0 } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  const { data, error } = await db()
    .from("universes")
    .insert({ name, slug, description, display_order, cover_image_url: "pending", is_active: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
