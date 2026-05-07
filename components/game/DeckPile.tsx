"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimState = "idle" | "receive" | "appear" | "give";

interface DeckPileProps {
  count: number;
  label: string;
  width?: number;
  height?: number;
}

export function DeckPile({ count, label, width = 52, height = 72 }: DeckPileProps) {
  const prevCountRef = useRef(count);
  const [anim, setAnim] = useState<AnimState>("idle");
  const layers = Math.min(count, 3);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (count === prev) return;

    const next: AnimState = count > prev ? (prev === 0 ? "appear" : "receive") : "give";
    setAnim(next);
    const t = setTimeout(() => setAnim("idle"), 600);
    return () => clearTimeout(t);
  }, [count]);

  const cardAnimate =
    anim === "receive" ? { scale: [1, 1.14, 0.97, 1], y: [0, -7, 3, 0] } :
    anim === "appear"  ? { scale: [0.55, 1.1, 0.97, 1], y: [-12, 3, -1, 0], opacity: [0, 1, 1, 1] } :
    anim === "give"    ? { scale: [1, 0.91, 1.03, 1] } :
    { scale: 1, y: 0, opacity: 1 };

  const cardTransition = {
    duration: anim === "appear" ? 0.52 : anim === "receive" ? 0.44 : 0.32,
    ease: "easeOut",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width, height }}>
        {/* Depth shadow layers — only shown when count is high enough */}
        {layers >= 3 && (
          <div
            className="card-back-pattern border-2 border-black absolute"
            style={{ width, height, bottom: 6, left: 4, opacity: 0.4 }}
          />
        )}
        {layers >= 2 && (
          <div
            className="card-back-pattern border-2 border-black absolute"
            style={{ width, height, bottom: 3, left: 2, opacity: 0.65 }}
          />
        )}

        {/* Top card or empty slot */}
        <AnimatePresence mode="sync">
          {count > 0 ? (
            <motion.div
              key="pile"
              className="card-back-pattern border-2 border-black absolute"
              style={{ width, height, bottom: 0, left: 0 }}
              animate={cardAnimate}
              transition={cardTransition}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-dashed border-grey-mid bg-grey-light absolute flex items-center justify-center"
              style={{ width, height, bottom: 0, left: 0 }}
            >
              <span className="text-[9px] text-grey-mid">0</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label + count */}
      <div className="text-center" style={{ width: width + 8 }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-grey-dark leading-tight">{label}</p>
        <motion.p
          className="font-mono text-[11px] font-bold"
          animate={anim !== "idle" ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {count}
        </motion.p>
      </div>
    </div>
  );
}
