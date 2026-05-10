"use client";

import { ProfileButton } from "./ProfileButton";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QuickJoinModal } from "@/components/room/QuickJoinModal";
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaveWarn, setLeaveWarn] = useState(false);

  // Are we inside a room lobby?
  const inRoom = pathname?.startsWith("/room/");

  function handleLogoClick(e: React.MouseEvent) {
    if (inRoom) {
      e.preventDefault();
      setLeaveWarn(true);
    }
  }

  function confirmLeave() {
    setLeaveWarn(false);
    // Fire-and-forget leave if we're in a room
    // The Lobby component handles the actual leave API call
    router.push("/");
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-black bg-white">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="font-display text-2xl tracking-widest hover:opacity-70 transition-opacity"
          >
            FTC
          </Link>

          {/* Nav links — hidden in-room to keep game UI clean */}
          {!inRoom && (
            <nav className="hidden sm:flex items-center gap-1">
              {[
                { href: "/decks", label: "Universes" },
                { href: "/play", label: "Play" },
                { href: "/how-to-play", label: "How to Play" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-transparent hover:border-black transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!inRoom && (
            <button
              onClick={() => setJoinOpen(true)}
              className="btn-brutal btn-secondary text-[10px] sm:text-xs px-2.5 sm:px-4 py-2"
            >
              Join Room
            </button>
          )}
          <ProfileButton />
        </div>
      </header>

      {/* Leave room warning */}
      <AnimatePresence>
        {leaveWarn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.6)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="panel-brutal w-full max-w-sm mx-4"
            >
              <div className="bg-black px-5 py-3 border-b-2 border-black">
                <p className="font-display text-white text-xl tracking-widest">LEAVE ROOM?</p>
              </div>
              <div className="p-5">
                <p className="text-sm mb-5 leading-relaxed text-grey-dark">
                  You&apos;ll be removed from the lobby. The room will stay open for others.
                </p>
                <div className="flex gap-3">
                  <button className="btn-brutal btn-primary flex-1" onClick={confirmLeave}>
                    Yes, leave
                  </button>
                  <button className="btn-brutal btn-secondary flex-1" onClick={() => setLeaveWarn(false)}>
                    Stay
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick join modal */}
      <AnimatePresence>
        {joinOpen && <QuickJoinModal onClose={() => setJoinOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
