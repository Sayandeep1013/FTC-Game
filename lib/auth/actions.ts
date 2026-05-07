"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function getAppUrl(): string {
  // 1. Explicit env var — set this in Vercel dashboard
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // 2. Vercel automatically sets VERCEL_URL for every deployment
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // 3. Local dev fallback
  return "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) redirect("/login?error=oauth_failed");
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
