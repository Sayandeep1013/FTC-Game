import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { BackButton } from "@/components/ui/BackButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, total_wins, total_games, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-10 pb-16">

        <div className="mb-4">
          <BackButton fallback="/" />
        </div>

        {/* Header */}
        <div className="panel-brutal mb-6">
          <div className="bg-black px-5 py-3 border-b-2 border-black">
            <h1 className="font-display text-white text-2xl tracking-widest">PROFILE</h1>
          </div>

          <div className="px-5 py-5 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 border-2 border-black overflow-hidden flex-shrink-0 bg-grey-light">
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url as string}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{profile?.username ?? "—"}</p>
              <p className="text-xs text-grey-dark uppercase tracking-wider">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="panel-brutal mb-6">
          <div className="px-4 py-2 border-b-2 border-black bg-grey-light">
            <p className="text-[10px] font-bold uppercase tracking-widest text-grey-dark">Stats</p>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-black border-b-0">
            <div className="px-5 py-4 text-center">
              <p className="font-display text-4xl">{profile?.total_games ?? 0}</p>
              <p className="text-[10px] uppercase tracking-widest text-grey-dark font-bold mt-1">Games Played</p>
            </div>
            <div className="px-5 py-4 text-center">
              <p className="font-display text-4xl">{profile?.total_wins ?? 0}</p>
              <p className="text-[10px] uppercase tracking-widest text-grey-dark font-bold mt-1">Wins</p>
            </div>
          </div>
        </div>

        {/* Edit username */}
        <ProfileForm currentUsername={profile?.username ?? ""} />
      </div>
    </main>
  );
}
