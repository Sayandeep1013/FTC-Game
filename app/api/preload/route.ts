import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const STORAGE_BASE =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/game-assets`;

/** Returns every image URL the loading screen should preload. */
export async function GET() {
  const supabase = await createClient();

  const [{ data: decks }, { data: cards }] = await Promise.all([
    supabase
      .from("decks")
      .select("cover_image_url")
      .eq("is_active", true),
    supabase
      .from("cards")
      .select("image_url, image_storage_path")
      .not("image_storage_path", "is", null)
      .limit(60), // first 60 card images is enough to warm the cache
  ]);

  const urls: string[] = ["/topo-bg.svg"]; // always preload the background

  for (const deck of decks ?? []) {
    const c = deck.cover_image_url;
    if (!c || c === "pending") continue;
    urls.push(c.startsWith("http") ? c : `${STORAGE_BASE}/${c}`);
  }

  for (const card of cards ?? []) {
    if (card.image_storage_path)
      urls.push(`${STORAGE_BASE}/${card.image_storage_path}`);
    else if (card.image_url)
      urls.push(card.image_url);
  }

  return NextResponse.json({ urls });
}
