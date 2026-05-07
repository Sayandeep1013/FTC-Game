"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUsername(username: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const clean = username.trim();
  if (clean.length < 2) return { error: "Username must be at least 2 characters" };
  if (clean.length > 30) return { error: "Username max 30 characters" };
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) return { error: "Only letters, numbers, underscores" };

  const admin = createAdminClient();

  // Check uniqueness
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "Username already taken" };

  const { error } = await admin
    .from("profiles")
    .update({ username: clean })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}
