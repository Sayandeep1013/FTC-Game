import { createClient } from "@/lib/supabase/server";
import { Lobby } from "@/components/room/Lobby";
import { redirect } from "next/navigation";
import type { Deck } from "@/types";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const supabase = await createClient();

  // Fetch room + deck
  const { data: room } = await supabase
    .from("rooms")
    .select(`
      *,
      deck:deck_id (
        id, name, slug, cover_image_url, is_active, created_at,
        stat_definitions (id, deck_id, name, display_name, is_inverse, display_order)
      )
    `)
    .eq("room_code", roomCode)
    .single();

  if (!room) redirect("/");

  const deck = room.deck as Deck;

  return <Lobby roomCode={roomCode} deck={deck} />;
}
