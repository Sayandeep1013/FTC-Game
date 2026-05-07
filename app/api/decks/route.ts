import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select(`
      id, name, slug, cover_image_url,
      stat_definitions (id, name, display_name, is_inverse, display_order),
      cards (id, name, image_url, image_storage_path,
        card_stats (id, value, stat_definition_id)
      )
    `)
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(decks);
}
