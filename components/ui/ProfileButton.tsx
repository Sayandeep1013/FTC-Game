"use client";

import { signOut } from "@/lib/auth/actions";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function ProfileButton() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileWarn, setProfileWarn] = useState(false);
  const [loginWarn, setLoginWarn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const inRoom = pathname?.startsWith("/room/");

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
    return <div className="w-10 h-10 border-2 border-black bg-grey-light animate-pulse" />;
  }

  // Guest — show profile icon
  if (!user) {
    function handleGuestProfileClick(e: React.MouseEvent) {
      if (inRoom) {
        e.preventDefault();
        setLoginWarn(true);
      }
    }

    return (
      <>
        <Link
          href="/login"
          onClick={handleGuestProfileClick}
          className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-100"
          title="Sign in"
          style={{ boxShadow: "3px 3px 0px #0a0a0a" }}
        >
          <ProfileIcon />
        </Link>

        <AnimatePresence>
          {loginWarn && (
            <WarnModal
              title="LEAVE LOBBY?"
              message="Signing in will take you away from this lobby."
              confirm="Sign in anyway"
              onConfirm={() => { setLoginWarn(false); router.push("/login"); }}
              onCancel={() => setLoginWarn(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Logged-in user
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Player";

  function handleProfileClick(e: React.MouseEvent) {
    if (inRoom) {
      e.preventDefault();
      setOpen(false);
      setProfileWarn(true);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
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
            <Link
              href="/profile"
              onClick={handleProfileClick}
              className="block w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider hover:bg-grey-light transition-colors border-b border-grey-light"
            >
              My Profile
            </Link>
            <form action={signOut}>
              <button type="submit" className="deck-btn-dark w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider">
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>

      <AnimatePresence>
        {profileWarn && (
          <WarnModal
            title="LEAVE LOBBY?"
            message="Going to your profile will remove you from the current lobby."
            confirm="Go to profile"
            onConfirm={() => { setProfileWarn(false); router.push("/profile"); }}
            onCancel={() => setProfileWarn(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function WarnModal({ title, message, confirm, onConfirm, onCancel }: {
  title: string; message: string; confirm: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.6)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="panel-brutal w-full max-w-sm mx-4"
      >
        <div className="bg-black px-5 py-3 border-b-2 border-black">
          <p className="font-display text-white text-xl tracking-widest">{title}</p>
        </div>
        <div className="p-5">
          <p className="text-sm mb-5 leading-relaxed text-grey-dark">{message}</p>
          <div className="flex gap-3">
            <button className="btn-brutal btn-primary flex-1" onClick={onConfirm}>{confirm}</button>
            <button className="btn-brutal btn-secondary flex-1" onClick={onCancel}>Stay</button>
          </div>
        </div>
      </motion.div>
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
