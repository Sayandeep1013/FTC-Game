import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select(`
      id, universe_id, name, slug, cover_image_url, is_active, display_order, created_at,
      universe:universes(id, name, slug),
      stat_definitions (id, name, display_name, unit_label, value_format, is_inverse, display_order),
      cards (id, name, image_url, image_storage_path,
        card_stats (id, value, stat_definition_id)
      )
    `)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(decks);
}
