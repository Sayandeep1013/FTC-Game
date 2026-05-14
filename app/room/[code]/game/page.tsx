import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GameBoard } from "@/components/game/GameBoard";

export default async function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const supabase = await createClient();

  // Verify game is active
  const { data: room } = await supabase
    .from("rooms")
    .select("status, deck_id, deck:deck_id(name, slug, cover_image_url)")
    .eq("room_code", roomCode)
    .single();

  if (!room) redirect("/");
  if (room.status === "waiting") redirect(`/room/${roomCode}`);

  const deck = room.deck as unknown as { name: string; slug: string; cover_image_url: string | null } | null;

  return (
    <GameBoard
      roomCode={roomCode}
      deckName={deck?.name ?? "Unknown Deck"}
      deckSlug={deck?.slug ?? ""}
      deckCoverImageUrl={deck?.cover_image_url ?? null}
    />
  );
}
