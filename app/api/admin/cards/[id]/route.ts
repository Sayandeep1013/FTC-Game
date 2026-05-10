import { requireAdmin, db } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH — update card name, stats, or image
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;

  const contentType = req.headers.get("content-type") ?? "";

  // Image upload — multipart form
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const deckSlug = formData.get("deck_slug") as string;
    const cardName = formData.get("card_name") as string;

    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = cardName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const storagePath = `cards/${deckSlug}/${safeName}-${Date.now()}.${ext}`;

    const supabase = createAdminClient();
    await supabase.storage.createBucket("game-assets", { public: true });

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("game-assets")
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: dbError } = await supabase
      .from("cards")
      .update({ image_storage_path: storagePath, image_url: null })
      .eq("id", id);

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ path: storagePath });
  }

  // JSON update — name or stat values
  const body = await req.json();
  const supabase = db();

  if (body.name !== undefined) {
    const { error } = await supabase.from("cards").update({ name: body.name }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // stats: Record<stat_definition_id, value>
  if (body.stats) {
    for (const [statDefId, value] of Object.entries(body.stats as Record<string, number>)) {
      await supabase
        .from("card_stats")
        .upsert({ card_id: id, stat_definition_id: statDefId, value: Number(value) },
          { onConflict: "card_id,stat_definition_id" });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const supabase = db();
  await supabase.from("card_stats").delete().eq("card_id", id);
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
