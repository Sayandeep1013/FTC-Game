import { PlayPageClient } from "@/components/deck/PlayPageClient";
import { getPublicUniverses } from "@/lib/data/universes";
import type { Universe } from "@/types";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const universes = await getPublicUniverses() as Universe[];

  return <PlayPageClient initialUniverses={universes} />;
}
