"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { useEffect, useRef } from "react";

interface TableCardProps {
  card: CardInfo;
  statDefs: StatDefinition[];
  isActive?: boolean;
  onPickStat?: (statId: string) => void;
  highlightStatId?: string | null;
  lockedStatId?: string | null;
  faceDown?: boolean;
  label?: string;
  enterFrom?: "top" | "bottom" | "none";
  /** Show ✓ on the highlighted stat — only for the local player's card while waiting for result */
  showCheckmark?: boolean;
}

/**
 * TableCard renders in whatever size its parent gives it.
 * Parent wraps it in .game-card-wrap which handles responsive sizing via CSS clamp().
 */
export function TableCard({
  card, statDefs, isActive, onPickStat,
  highlightStatId, lockedStatId,
  faceDown = false, label, enterFrom = "none",
  showCheckmark = false,
}: TableCardProps) {
  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);

  // Sort and split into 2 columns (4+4) — same as details modal
  const sorted     = [...statDefs].sort((a, b) => a.display_order - b.display_order);
  const leftStats  = sorted.filter((_, i) => i % 2 === 0);
  const rightStats = sorted.filter((_, i) => i % 2 === 1);

  // Tilt only on image + name area (stats area stops propagation so tilt pauses there)
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 350, damping: 32 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-7, 7]), { stiffness: 350, damping: 32 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isActive || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width * 2 - 1);
    my.set((e.clientY - r.top) / r.height * 2 - 1);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  // Manage flip state
  const flipRef = useRef(faceDown);
  useEffect(() => { flipRef.current = faceDown; }, [faceDown]);

  const enterY = enterFrom === "top" ? -28 : enterFrom === "bottom" ? 28 : 0;

  return (
    <div className="flex flex-col items-center w-full h-full">
      {label && (
        <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark mb-1 flex-shrink-0">{label}</p>
      )}

      {/* Flip + enter animation wrapper */}
      <motion.div
        initial={{ y: enterFrom !== "none" ? enterY : 0, opacity: enterFrom !== "none" ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ scale: 0.75, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        style={{ perspective: 900, width: "100%", flex: 1, minHeight: 0 }}
      >
        <motion.div
          animate={{ rotateY: faceDown ? 180 : 0 }}
          initial={{ rotateY: faceDown ? 180 : 0 }}
          transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
        >
          {/* ── FRONT ── */}
          <motion.div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              backfaceVisibility: "hidden",
              width: "100%", height: "100%",
              rotateX: isActive ? rx : 0,
              rotateY: isActive ? ry : 0,
              boxShadow: isActive ? "5px 5px 0 #0a0a0a" : "3px 3px 0 #0a0a0a",
            }}
            className={`border-2 border-black bg-white flex flex-col overflow-hidden ${isActive ? "card-active" : ""}`}
          >
            {/* Image — 25% of height */}
            <div
              className="border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ height: "25%" }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-display text-grey-dark select-none" style={{ fontSize: "clamp(1rem, 3vw, 2rem)" }}>
                  {card.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Name strip */}
            <div className="bg-black px-2 py-0.5 border-b-2 border-black flex-shrink-0">
              <p className="font-display text-white leading-tight truncate" style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.85rem)" }}>
                {card.name.toUpperCase()}
              </p>
            </div>

            {/*
              Stats — 4 left + 4 right columns.
              onMouseMove stopPropagation: pauses the card tilt while user hovers stats,
              so the tilt doesn't interfere with reading/clicking stats.
              Using plain <div> (not motion.div) for reliable click handling with no animation conflicts.
            */}
            <div
              className={`flex flex-1 min-h-0 overflow-hidden${isActive ? " stats-interactive" : ""}`}
              onMouseMove={e => e.stopPropagation()}
              onMouseLeave={() => { mx.set(0); my.set(0); }}
            >
              <div className="flex-1 border-r border-black flex flex-col min-h-0 overflow-hidden">
                {leftStats.map(stat => (
                  <StatRow
                    key={stat.id}
                    stat={stat}
                    value={card.stats[stat.name]}
                    isHighlighted={highlightStatId === stat.id}
                    isLocked={!!(lockedStatId && lockedStatId !== stat.id)}
                    canClick={!!isActive && !!onPickStat && highlightStatId !== stat.id && !(lockedStatId && lockedStatId !== stat.id)}
                    onPick={onPickStat}
                    showCheckmark={showCheckmark}
                  />
                ))}
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {rightStats.map(stat => (
                  <StatRow
                    key={stat.id}
                    stat={stat}
                    value={card.stats[stat.name]}
                    isHighlighted={highlightStatId === stat.id}
                    isLocked={!!(lockedStatId && lockedStatId !== stat.id)}
                    canClick={!!isActive && !!onPickStat && highlightStatId !== stat.id && !(lockedStatId && lockedStatId !== stat.id)}
                    onPick={onPickStat}
                    showCheckmark={showCheckmark}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── BACK ── */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute", inset: 0,
              boxShadow: "3px 3px 0 #0a0a0a",
            }}
            className="card-back-pattern border-2 border-black"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plain div stat row — no Framer Motion. Pure CSS hover (defined in globals.css).
// This prevents any animation conflict with the card tilt.
// ─────────────────────────────────────────────────────────────────────────────

function StatRow({ stat, value, isHighlighted, isLocked, canClick, onPick, showCheckmark }: {
  stat: StatDefinition;
  value: number | undefined;
  isHighlighted: boolean;
  isLocked: boolean;
  canClick: boolean;
  onPick?: (id: string) => void;
  showCheckmark?: boolean;
}) {
  return (
    <div
      className={`stat-row flex-1 min-h-0 ${isHighlighted ? "selected" : ""} ${isLocked ? "opacity-25" : ""}`}
      style={{
        cursor: canClick ? "pointer" : "default",
        padding: "0 5px",
        pointerEvents: canClick ? "auto" : "none",
      }}
      onClick={() => { if (canClick && onPick) onPick(stat.id); }}
    >
      <span
        className="stat-label truncate"
        style={{ fontSize: "clamp(0.5rem, 1vw, 0.6rem)", letterSpacing: "0.04em" }}
      >
        {stat.display_name}
      </span>
      <span
        className="font-mono font-bold flex-shrink-0 ml-1 flex items-center gap-0.5"
        style={{ fontSize: "clamp(0.6rem, 1.1vw, 0.72rem)" }}
      >
        {value ?? "—"}{isHighlighted && showCheckmark && <span style={{ fontSize: "0.65em", opacity: 0.85 }}>✓</span>}
      </span>
    </div>
  );
}
