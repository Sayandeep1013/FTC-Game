"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_MS = 2800; // minimum screen time so it never feels like a flash

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("Starting up");
  const [imageCount, setImageCount] = useState({ loaded: 0, total: 0 });
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const start = Date.now();
    let cancelled = false;

    // Smoothly animate progress to a target value
    function animateTo(target: number, durationMs: number): Promise<void> {
      return new Promise((resolve) => {
        const startVal = progress;
        const startTime = Date.now();
        function tick() {
          if (cancelled) return resolve();
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setProgress(startVal + (target - startVal) * eased);
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });
    }

    async function run() {
      // Stage 1 — warm up 0 → 12%
      await animateTo(12, 350);
      if (cancelled) return;

      // Stage 2 — fetch the list of assets to preload
      setLabel("Fetching universe data");
      let urls: string[] = [];
      try {
        const res = await fetch("/api/preload");
        const data = await res.json();
        urls = Array.isArray(data.urls) ? data.urls : [];
      } catch {
        // network issue — continue without preloading
      }
      if (cancelled) return;

      await animateTo(20, 200);

      // Stage 3 — preload every image, bar advances per image
      const total = urls.length;
      setImageCount({ loaded: 0, total });
      setLabel(total > 0 ? "Loading assets" : "Preparing");

      let loaded = 0;
      const IMAGE_RANGE = 72; // 20 → 92%

      await Promise.all(
        urls.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = img.onerror = () => {
                if (cancelled) return resolve();
                loaded++;
                setImageCount({ loaded, total });
                setProgress(20 + (loaded / Math.max(total, 1)) * IMAGE_RANGE);
                resolve();
              };
              img.src = src;
            })
        )
      );
      if (cancelled) return;

      // Stage 4 — finalize
      setLabel("Ready");
      await animateTo(100, 300);

      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed) + 350; // +350 for bar to visually fill
      setTimeout(() => { if (!cancelled) onDoneRef.current(); }, wait);
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading-screen">
      <CornerDecor />

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

      <motion.div
        className="loading-progress-track mt-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="loading-progress-fill"
          style={{ width: `${progress}%`, transition: "width 0.18s ease-out" }}
        />
      </motion.div>

      <motion.p
        className="text-grey-mid text-[10px] uppercase tracking-[0.18em] mt-3 tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {label}
        {imageCount.total > 0 && (
          <span className="text-grey-dark ml-2">
            {imageCount.loaded}/{imageCount.total}
          </span>
        )}
      </motion.p>
    </div>
  );
}

function CornerDecor() {
  const size = 40;
  const stroke = "rgba(245,245,240,0.15)";
  return (
    <>
      <svg width={size} height={size} className="absolute top-6 left-6" fill="none">
        <line x1="0" y1="0" x2={size} y2="0" stroke={stroke} strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      <svg width={size} height={size} className="absolute top-6 right-6" fill="none">
        <line x1="0" y1="0" x2={size} y2="0" stroke={stroke} strokeWidth="1.5" />
        <line x1={size} y1="0" x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      <svg width={size} height={size} className="absolute bottom-6 left-6" fill="none">
        <line x1="0" y1={size} x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
      <svg width={size} height={size} className="absolute bottom-6 right-6" fill="none">
        <line x1="0" y1={size} x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
        <line x1={size} y1="0" x2={size} y2={size} stroke={stroke} strokeWidth="1.5" />
      </svg>
    </>
  );
}

export function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!done && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
          >
            <LoadingScreen onDone={() => setDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.35, delay: done ? 0.15 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
