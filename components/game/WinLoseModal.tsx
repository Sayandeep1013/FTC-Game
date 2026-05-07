"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface WinLoseModalProps {
  won: boolean;
  winnerName: string;
  isSpectating: boolean;
  roomCode: string;
}

export function WinLoseModal({ won, winnerName, isSpectating, roomCode }: WinLoseModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,10,10,0.8)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="panel-brutal w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="bg-black px-5 py-4 border-b-2 border-black text-center">
          <p className="font-display text-white tracking-widest" style={{ fontSize: "2.5rem" }}>
            {isSpectating ? "GAME OVER" : won ? "VICTORY!" : "DEFEATED"}
          </p>
        </div>

        <div className="p-6 text-center">
          {/* Result description */}
          {isSpectating ? (
            <p className="text-sm text-grey-dark mb-6">
              <span className="font-bold text-black">{winnerName}</span> wins the match.
            </p>
          ) : won ? (
            <div className="mb-6">
              <p className="text-4xl mb-2">🏆</p>
              <p className="text-sm text-grey-dark">You collected all the cards. Legendary.</p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-grey-dark mb-1">Better luck next time.</p>
              <p className="text-xs text-grey-mid">
                Winner: <span className="font-bold text-black">{winnerName}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              className="btn-brutal btn-primary w-full"
              onClick={() => router.push(`/room/${roomCode}`)}
            >
              Play Again
            </button>
            <button
              className="btn-brutal btn-secondary w-full"
              onClick={() => router.push("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
