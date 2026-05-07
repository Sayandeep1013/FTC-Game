import { requireAdmin, db } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const slug = formData.get("slug") as string;

  if (!file || !slug) return NextResponse.json({ error: "file and slug required" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `deck-covers/${slug}.${ext}`;

  const supabase = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("game-assets")
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: dbError } = await supabase
    .from("decks")
    .update({ cover_image_url: storagePath })
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ path: storagePath });
}
