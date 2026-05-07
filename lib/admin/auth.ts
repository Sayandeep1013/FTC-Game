import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Returns the current user's email if they're an admin, null otherwise. */
export async function getAdminUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(user.email.toLowerCase()) ? user.email : null;
}

/** Use in API routes — returns 401/403 JSON if not admin. */
export async function requireAdmin(): Promise<{ ok: true } | Response> {
  const admin = await getAdminUser();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { ok: true };
}

export { createAdminClient as db };
