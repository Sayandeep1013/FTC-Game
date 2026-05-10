import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "game-assets";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const slug = formData.get("slug") as string;

  if (!file || !slug) return NextResponse.json({ error: "file and slug required" }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set in Vercel env vars" }, { status: 500 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const stamp = Date.now();
  const storagePath = `deck-covers/${slug}-${stamp}.${ext}`;
  const supabase = createAdminClient();

  // Create bucket if it doesn't exist — errors only if bucket already exists (which is fine)
  const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
  });
  if (bucketErr && !bucketErr.message.includes("already exists") && !bucketErr.message.includes("Duplicate")) {
    console.error("Bucket create error:", bucketErr.message);
    return NextResponse.json({ error: `Bucket error: ${bucketErr.message}` }, { status: 500 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError.message);
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { error: dbError } = await supabase
    .from("decks")
    .update({ cover_image_url: storagePath })
    .eq("id", id);

  if (dbError) {
    console.error("DB error:", dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ path: storagePath });
}
