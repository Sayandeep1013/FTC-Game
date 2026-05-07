"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CardInfo } from "@/hooks/useGame";
import type { StatDefinition } from "@/types";
import { getCardImageUrl } from "@/lib/utils/imageUrl";
import { useEffect, useRef, useState } from "react";

interface TableCardProps {
  card: CardInfo;
  statDefs: StatDefinition[];
  isActive?: boolean;
  onPickStat?: (statId: string) => void;
  highlightStatId?: string | null;
  lockedStatId?: string | null;
  /** Show card back (flips to front when changed to false) */
  faceDown?: boolean;
  label?: string;
  enterFrom?: "top" | "bottom" | "none";
}

export function TableCard({
  card, statDefs, isActive, onPickStat,
  highlightStatId, lockedStatId, faceDown = false,
  label, enterFrom = "none",
}: TableCardProps) {
  // Track flip state separately so we can animate the transition
  const [flipped, setFlipped] = useState(faceDown);
  useEffect(() => { setFlipped(faceDown); }, [faceDown]);

  const imageUrl = getCardImageUrl(card.image_url, card.image_storage_path);
  const sorted = [...statDefs].sort((a, b) => a.display_order - b.display_order);

  // Tilt on mouse move (active card only)
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 400, damping: 30 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 400, damping: 30 });
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isActive || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width * 2 - 1);
    my.set((e.clientY - r.top) / r.height * 2 - 1);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  const enterY = enterFrom === "top" ? -30 : enterFrom === "bottom" ? 30 : 0;

  return (
    <div className="flex flex-col items-center gap-1 w-full h-full">
      {label && (
        <p className="text-[9px] font-bold uppercase tracking-wider text-grey-dark flex-shrink-0">{label}</p>
      )}

      {/* Flip container */}
      <motion.div
        initial={{ y: enterFrom !== "none" ? enterY : 0, opacity: enterFrom !== "none" ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        style={{ perspective: 900, width: "100%", flex: 1, minHeight: 0 }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          initial={{ rotateY: faceDown ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
        >
          {/* FRONT — card face */}
          <motion.div
            ref={cardRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
              backfaceVisibility: "hidden",
              width: "100%", height: "100%",
              rotateX: isActive ? rx : 0,
              rotateY: isActive ? ry : 0,
            }}
            className={`border-2 border-black bg-white flex flex-col overflow-hidden ${isActive ? "card-active" : ""}`}
            animate={isActive ? { boxShadow: "6px 6px 0px #0a0a0a" } : { boxShadow: "3px 3px 0px #0a0a0a" }}
          >
            {/* Image area */}
            <div className="border-b-2 border-black bg-grey-light flex items-center justify-center overflow-hidden flex-shrink-0" style={{ height: "28%" }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={card.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-display text-grey-dark" style={{ fontSize: "clamp(1.2rem, 3vw, 2rem)" }}>
                  {card.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Name strip */}
            <div className="bg-black px-2 py-1 border-b-2 border-black flex-shrink-0">
              <p className="font-display text-white leading-tight truncate" style={{ fontSize: "clamp(0.6rem, 1.5vw, 0.85rem)" }}>
                {card.name.toUpperCase()}
              </p>
            </div>

            {/* Stats — all 8 in a single column to prevent overflow */}
            <div className="flex flex-col flex-1 overflow-hidden divide-y divide-grey-light">
              {sorted.map(stat => (
                <StatRow
                  key={stat.id}
                  stat={stat}
                  value={card.stats[stat.name]}
                  isHighlighted={highlightStatId === stat.id}
                  isLocked={!!(lockedStatId && lockedStatId !== stat.id)}
                  isActive={!!isActive}
                  onPick={onPickStat}
                />
              ))}
            </div>
          </motion.div>

          {/* BACK — card pattern */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute",
              inset: 0,
              boxShadow: "3px 3px 0px #0a0a0a",
            }}
            className="card-back-pattern border-2 border-black"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function StatRow({ stat, value, isHighlighted, isLocked, isActive, onPick }: {
  stat: StatDefinition; value: number | undefined;
  isHighlighted: boolean; isLocked: boolean; isActive: boolean;
  onPick?: (id: string) => void;
}) {
  const [clicked, setClicked] = useState(false);
  const canClick = isActive && !!onPick && !isHighlighted && !isLocked;

  function handleClick() {
    if (!canClick) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 250);
    onPick!(stat.id);
  }

  return (
    <motion.div
      className={`stat-row flex-1 min-h-0 ${isHighlighted ? "selected" : ""} ${isLocked ? "opacity-30" : ""}`}
      style={{ cursor: canClick ? "pointer" : "default" }}
      onClick={handleClick}
      animate={clicked ? { scale: [1, 0.93, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
      whileHover={canClick ? { backgroundColor: "#0a0a0a", color: "#f5f5f0" } : {}}
    >
      <span className="stat-label truncate" style={{ fontSize: "clamp(0.5rem, 1vw, 0.65rem)" }}>{stat.display_name}</span>
      <span className="stat-value font-mono" style={{ fontSize: "clamp(0.6rem, 1.2vw, 0.85rem)" }}>{value ?? "—"}</span>
    </motion.div>
  );
}
