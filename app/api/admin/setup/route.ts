import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "game-assets";

/** GET /api/admin/setup — creates the storage bucket and returns a diagnostic report. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const report: Record<string, unknown> = {};

  report.service_role_key_set = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  report.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ...report, error: "SUPABASE_SERVICE_ROLE_KEY missing from env vars" }, { status: 500 });
  }

  const supabase = createAdminClient();

  // List existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  report.existing_buckets = buckets?.map(b => b.name) ?? listErr?.message;

  // Create game-assets if missing
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  });

  if (createErr) {
    if (createErr.message.includes("already exists") || createErr.message.includes("Duplicate")) {
      report.bucket_status = `${BUCKET} already exists — OK`;
    } else {
      report.bucket_status = `create failed: ${createErr.message}`;
      return NextResponse.json({ ...report, error: createErr.message }, { status: 500 });
    }
  } else {
    report.bucket_status = `${BUCKET} created successfully`;
  }

  return NextResponse.json({ ok: true, ...report });
}
