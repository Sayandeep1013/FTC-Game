"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// All external assets that must preload before the loading screen exits
const DECK_COVER_URLS = [
  "https://upload.wikimedia.org/wikipedia/en/1/1e/Ben10poster.jpg",
  "https://upload.wikimedia.org/wikipedia/en/0/04/MMPR_title_screen.jpg",
  "https://upload.wikimedia.org/wikipedia/en/6/6a/Avengers_Endgame_poster.jpg",
  "https://upload.wikimedia.org/wikipedia/en/a/a7/Dragon_Ball_Super_logo.png",
];

function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // resolve even on error — don't block forever
        img.src = src;
      })
  );
  return Promise.all(promises).then(() => {});
}

// Minimum time (ms) loading screen is shown — feels intentional, not a flash
const MIN_LOAD_MS = 1800;

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();

    // Animate progress bar while assets load
    const interval = setInterval(() => {
      // Fast at first, slows near 85% until assets are actually done
      setProgress((p) => {
        if (p >= 85) return p;
        return Math.min(85, p + (85 - p) * 0.12);
      });
    }, 80);

    preloadImages(DECK_COVER_URLS).then(() => {
      clearInterval(interval);
      setProgress(100);
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed);
      setTimeout(onDone, remaining + 300); // +300 for bar to fill visually
    });

    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="loading-screen">
      {/* Corner line decorations */}
      <CornerDecor />

      {/* Logo stamps in */}
      <motion.h1
        className="font-display text-white select-none"
        style={{ fontSize: "clamp(4rem, 12vw, 9rem)", letterSpacing: "0.15em" }}
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      >
        FTC
      </motion.h1>

      <motion.p
        className="text-grey-mid text-xs uppercase tracking-[0.25em] mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Fantasy Trump Cards
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="loading-progress-track mt-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div
          className="loading-progress-fill"
          style={{ width: `${progress}%`, transition: "width 0.3s ease" }}
        />
      </motion.div>

      <motion.p
        className="text-grey-mid text-xs uppercase tracking-[0.2em] mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Loading assets...
      </motion.p>
    </div>
  );
}

// Thin line decorations in the four corners
function CornerDecor() {
  const size = 40;
  const stroke = "rgba(245,245,240,0.15)";
  return (
    <>
      {/* top-left */}
      <svg width={size} height={size} className="absolute top-6 left-6" fill="none">
        <line x1="0" y1="0" x2={size} y2="0" stroke={stroke} strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      {/* top-right */}
      <svg width={size} height={size} className="absolute top-6 right-6" fill="none">
        <line x1="0" y1="0" x2={size} y2="0" stroke={stroke} strokeWidth="1.5" />
        <line x1={size} y1="0" x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      {/* bottom-left */}
      <svg width={size} height={size} className="absolute bottom-6 left-6" fill="none">
        <line x1="0" y1={size} x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      {/* bottom-right */}
      <svg width={size} height={size} className="absolute bottom-6 right-6" fill="none">
        <line x1="0" y1={size} x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
        <line x1={size} y1="0" x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
    </>
  );
}

// Wrapper that fades the loading screen out and reveals children
export function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!done && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
          >
            <LoadingScreen onDone={() => setDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.3, delay: done ? 0.1 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
