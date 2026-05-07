"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/hooks/useAuth";

interface QuickJoinModalProps {
  onClose: () => void;
}

export function QuickJoinModal({ onClose }: QuickJoinModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const session = useSession();
  const [code, setCode] = useState("");
  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    const cleanCode = code.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleanCode.length < 6) { setError("Enter the full 6-character room code"); return; }
    if (!session) return;

    setError("");
    setLoading(true);

    const res = await fetch(`/api/rooms/${cleanCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: session.playerId,
        player_type: session.playerType,
        room_username: name.trim() || (user ? "Player" : "Guest"),
        avatar_url: session.avatarUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not join room");
      setLoading(false);
      return;
    }
    // Close modal FIRST — Header persists across navigations so we must reset state
    onClose();
    router.push(`/room/${data.room_code}`);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="panel-brutal w-full"
        style={{ maxWidth: 380 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 bg-black border-b-2 border-black">
          <span className="font-display text-white text-xl tracking-widest">JOIN ROOM</span>
          <button onClick={onClose} className="deck-btn-dark w-7 h-7 flex items-center justify-center text-sm font-bold">✕</button>
        </div>

        <div className="p-5">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
            Room code
          </label>
          <input
            className="input-brutal font-mono text-2xl text-center tracking-[0.4em] uppercase mb-4"
            placeholder="ABC123"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
            autoFocus
          />

          <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
            Your name
          </label>
          <input
            className="input-brutal mb-1"
            placeholder={user ? (user.user_metadata?.full_name as string) || "Player" : "Guest name..."}
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && join()}
          />
          {user && <p className="text-[10px] text-grey-mid mb-4">{user.email}</p>}

          {error && (
            <p className="text-xs font-bold bg-grey-light border border-black px-3 py-2 mt-2 mb-3">{error}</p>
          )}

          <button className="btn-brutal btn-primary w-full mt-4" onClick={join} disabled={loading}>
            {loading ? "Joining..." : "Join Room →"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
