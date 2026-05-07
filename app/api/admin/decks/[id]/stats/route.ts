import { requireAdmin, db } from "@/lib/admin/auth";
import { NextRequest, NextResponse } from "next/server";

// GET all stat definitions for a deck
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const supabase = db();
  const { data, error } = await supabase
    .from("stat_definitions")
    .select("*")
    .eq("deck_id", id)
    .order("display_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create or upsert stat definitions (accepts array)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const body = await req.json();
  const stats = Array.isArray(body) ? body : [body];
  const supabase = db();
  const { data, error } = await supabase
    .from("stat_definitions")
    .insert(stats.map((s: Record<string, unknown>) => ({ ...s, deck_id: id })))
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update a single stat definition by its own id
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { stat_id, ...updates } = await req.json();
  const supabase = db();
  const { data, error } = await supabase
    .from("stat_definitions")
    .update(updates)
    .eq("id", stat_id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE a stat definition
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const { stat_id } = await req.json();
  const supabase = db();
  const { error } = await supabase.from("stat_definitions").delete().eq("id", stat_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
