import { getPublicUniverses } from "@/lib/data/universes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const includeCards = url.searchParams.get("includeCards") === "1";
  const slug = url.searchParams.get("slug");

  try {
    return NextResponse.json(await getPublicUniverses({ includeCards, slug: slug ?? undefined }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load universes" }, { status: 500 });
  }
}
