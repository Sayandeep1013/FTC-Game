"use client";

import { ProfileButton } from "./ProfileButton";
import Link from "next/link";
import { useState } from "react";
import { QuickJoinModal } from "@/components/room/QuickJoinModal";
import { AnimatePresence } from "framer-motion";

export function Header() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-black bg-white">
        <Link href="/" className="font-display text-2xl tracking-widest hover:opacity-70 transition-opacity">
          FTC
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setJoinOpen(true)}
            className="btn-brutal btn-secondary text-[10px] sm:text-xs px-2.5 sm:px-4 py-2"
          >
            Join Room
          </button>
          <ProfileButton />
        </div>
      </header>

      <AnimatePresence>
        {joinOpen && <QuickJoinModal onClose={() => setJoinOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
