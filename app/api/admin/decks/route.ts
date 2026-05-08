import { requireAdmin, db } from "@/lib/admin/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = db();
  const { data, error } = await supabase
    .from("decks")
    .select("*, stat_definitions(count), cards(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  const supabase = db();
  const { data, error } = await supabase
    .from("decks")
    .insert({ name, slug, cover_image_url: "pending", is_active: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
