import { createClient } from "@/lib/supabase/server";

const FULL_SELECT = `
  id, name, slug, description, cover_image_url, is_active, display_order, created_at,
  decks (
    id, universe_id, name, slug, cover_image_url, is_active, display_order, created_at,
    stat_definitions (id, deck_id, name, display_name, is_inverse, display_order),
    cards (
      id, deck_id, name, image_url, image_storage_path,
      card_stats (id, card_id, stat_definition_id, value)
    )
  )
`;

const SUMMARY_SELECT = `
  id, name, slug, description, cover_image_url, is_active, display_order, created_at,
  decks (
    id, universe_id, name, slug, cover_image_url, is_active, display_order, created_at,
    stat_definitions (count),
    cards (count)
  )
`;

function getCount(value: unknown): number {
  return (value as { count: number }[])?.[0]?.count ?? 0;
}

export async function getPublicUniverses({ includeCards = false, slug }: { includeCards?: boolean; slug?: string } = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("universes")
    .select(includeCards ? FULL_SELECT : SUMMARY_SELECT)
    .eq("is_active", true)
    .eq("decks.is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .order("display_order", { referencedTable: "decks", ascending: true })
    .order("name", { referencedTable: "decks", ascending: true });

  if (slug) query = query.eq("slug", slug);

  const { data, error } = await query;

  if (error) {
    const { data: decks, error: deckError } = await supabase
      .from("decks")
      .select(includeCards
        ? `
          id, name, slug, cover_image_url, is_active, created_at,
          stat_definitions (id, deck_id, name, display_name, is_inverse, display_order),
          cards (
            id, deck_id, name, image_url, image_storage_path,
            card_stats (id, card_id, stat_definition_id, value)
          )
        `
        : "id, name, slug, cover_image_url, is_active, created_at, stat_definitions(count), cards(count)"
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (deckError) throw new Error(deckError.message);

    return (decks ?? []).map((deck, index) => ({
      id: `legacy-${deck.id}`,
      name: deck.name,
      slug: deck.slug,
      description: `${deck.name} universe`,
      cover_image_url: deck.cover_image_url,
      is_active: true,
      display_order: (index + 1) * 10,
      created_at: deck.created_at,
      decks: [{
        ...deck,
        universe_id: `legacy-${deck.id}`,
        display_order: 10,
        card_count: includeCards ? deck.cards?.length ?? 0 : getCount(deck.cards),
        stat_count: includeCards ? deck.stat_definitions?.length ?? 0 : getCount(deck.stat_definitions),
        cards: includeCards ? deck.cards : [],
        stat_definitions: includeCards ? deck.stat_definitions : [],
        universe: { id: `legacy-${deck.id}`, name: deck.name, slug: deck.slug },
      }],
    }));
  }

  return (data ?? []).map((u) => ({
    ...u,
    decks: (u.decks ?? [])
      .filter((d) => d.is_active)
      .map((d) => includeCards ? d : {
        ...d,
        card_count: getCount(d.cards),
        stat_count: getCount(d.stat_definitions),
        cards: [],
        stat_definitions: [],
      }),
  })).filter((u) => u.decks.length > 0);
}
