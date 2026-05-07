"use client";

import { signOut } from "@/lib/auth/actions";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function ProfileButton() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="w-10 h-10 border-2 border-black bg-grey-light animate-pulse" />
    );
  }

  // Guest — show profile icon that links to login
  if (!user) {
    return (
      <Link
        href="/login"
        className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-100"
        title="Sign in"
        style={{ boxShadow: "3px 3px 0px #0a0a0a" }}
      >
        <ProfileIcon />
      </Link>
    );
  }

  // Logged-in user — avatar with dropdown
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Player";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 border-2 border-black overflow-hidden hover:opacity-80 transition-opacity"
        style={{ boxShadow: "3px 3px 0px #0a0a0a" }}
        title={displayName}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={40} height={40} className="object-cover" />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold font-mono text-sm">
            {displayName[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-48 bg-white border-2 border-black z-50"
          style={{ boxShadow: "4px 4px 0px #0a0a0a" }}
        >
          <div className="px-3 py-2 border-b-2 border-black">
            <p className="text-xs font-bold uppercase tracking-wider text-grey-dark">Signed in as</p>
            <p className="text-sm font-bold truncate">{displayName}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="deck-btn-dark w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider"
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="10" cy="7" r="3" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    </svg>
  );
}
