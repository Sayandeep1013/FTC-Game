import { getAdminUser } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen">
      {/* Admin header */}
      <div className="fixed left-0 right-0 z-30 flex items-center gap-6 px-6 py-2 bg-black border-b-2 border-black" style={{ top: "calc(3.5rem + 12px)" }}>
        <Link href="/admin" className="font-display text-white tracking-widest text-sm hover:opacity-70 transition-opacity">
          FTC ADMIN
        </Link>
        <span className="text-grey-dark text-[10px]">|</span>
        <Link href="/admin/decks" className="text-grey-mid text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors">
          Universes
        </Link>
        <div className="ml-auto">
          <span className="text-grey-dark text-[9px] uppercase tracking-wider">{admin}</span>
        </div>
      </div>
      {/* Push content below both headers */}
      <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto" style={{ paddingTop: "calc(3.5rem + 6px + 2.5rem + 1rem)" }}>
        {children}
      </div>
    </div>
  );
}
