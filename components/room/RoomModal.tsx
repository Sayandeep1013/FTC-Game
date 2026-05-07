"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { Deck } from "@/types";

type Step =
  | { id: "username" }
  | { id: "choose" }
  | { id: "create" }
  | { id: "join" }
  | { id: "loading"; message: string };

interface RoomModalProps {
  deck: Deck;
  onClose: () => void;
}

export function RoomModal({ deck, onClose }: RoomModalProps) {
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = useState<Step>({ id: "username" });
  const [username, setUsername] = useState("");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const effectiveUsername = username.trim() || (session?.playerType === "user" ? "Player" : "Guest");

  async function handleCreateRoom(vsAi = false) {
    if (!session) return;
    setError("");
    setStep({ id: "loading", message: vsAi ? "Setting up AI match..." : "Creating room..." });

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deck_id: deck.id,
        max_players: vsAi ? 2 : playerCount,
        player_id: session.playerId,
        player_type: session.playerType,
        room_username: effectiveUsername,
        avatar_url: session.avatarUrl,
        vs_ai: vsAi,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create room"); setStep({ id: "create" }); return; }
    router.push(`/room/${data.room_code}`);
  }

  async function handleJoinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) { setError("Enter the full 6-character room code"); return; }
    if (!session) return;
    setError("");
    setStep({ id: "loading", message: "Joining room..." });

    const res = await fetch(`/api/rooms/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: session.playerId,
        player_type: session.playerType,
        room_username: effectiveUsername,
        avatar_url: session.avatarUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Could not join room"); setStep({ id: "join" }); return; }
    router.push(`/room/${data.room_code}`);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="panel-brutal w-full"
        style={{ maxWidth: 420 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-black border-b-2 border-black">
          <div>
            <span className="font-display text-white text-xl tracking-widest">PLAY</span>
            <span className="text-grey-mid text-xs ml-2 uppercase tracking-wider">{deck.name}</span>
          </div>
          <button onClick={onClose} className="deck-btn-dark w-7 h-7 flex items-center justify-center text-sm font-bold">✕</button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* ── Step: username ── */}
            {step.id === "username" && (
              <motion.div key="username" {...fadeSlide}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
                  Your display name
                </label>
                <input
                  className="input-brutal mb-1"
                  placeholder="Enter a name..."
                  maxLength={20}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setStep({ id: "choose" })}
                  autoFocus
                />
                <p className="text-[10px] text-grey-mid mb-5">
                  This name is only for this session — not unique.
                </p>
                <button
                  className="btn-brutal btn-primary w-full"
                  onClick={() => setStep({ id: "choose" })}
                >
                  Continue →
                </button>
              </motion.div>
            )}

            {/* ── Step: choose mode ── */}
            {step.id === "choose" && (
              <motion.div key="choose" {...fadeSlide}>
                <p className="text-xs uppercase tracking-widest text-grey-dark font-bold mb-4">
                  Playing as <span className="text-black">{effectiveUsername}</span>
                </p>
                <div className="flex flex-col gap-3">
                  <ModeButton
                    label="Create Room"
                    sub="Host a game, share code with friends"
                    icon={<RoomIcon />}
                    onClick={() => setStep({ id: "create" })}
                  />
                  <ModeButton
                    label="Join Room"
                    sub="Enter a friend's room code"
                    icon={<JoinIcon />}
                    onClick={() => setStep({ id: "join" })}
                  />
                  <ModeButton
                    label="Play vs AI"
                    sub="Quick 1v1 against CPU (random)"
                    icon={<CpuIcon />}
                    onClick={() => handleCreateRoom(true)}
                    dark
                  />
                </div>
                <button
                  className="mt-4 text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors"
                  onClick={() => setStep({ id: "username" })}
                >
                  ← Change name
                </button>
              </motion.div>
            )}

            {/* ── Step: create ── */}
            {step.id === "create" && (
              <motion.div key="create" {...fadeSlide}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-3">
                  Number of players
                </p>
                <div className="flex gap-3 mb-5">
                  {([2, 3, 4] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setPlayerCount(n)}
                      className={`flex-1 py-4 border-2 border-black font-display text-3xl transition-all ${
                        playerCount === n
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-grey-light"
                      }`}
                      style={{ boxShadow: playerCount === n ? "3px 3px 0 #4a4a44" : "3px 3px 0 #0a0a0a" }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {error && <p className="text-xs font-bold text-black mb-3 bg-grey-light border border-black px-3 py-2">{error}</p>}
                <button className="btn-brutal btn-primary w-full mb-3" onClick={() => handleCreateRoom(false)}>
                  Create Room
                </button>
                <button className="text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors" onClick={() => setStep({ id: "choose" })}>
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── Step: join ── */}
            {step.id === "join" && (
              <motion.div key="join" {...fadeSlide}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
                  Room code
                </label>
                <input
                  className="input-brutal font-mono text-2xl text-center tracking-[0.4em] uppercase mb-1"
                  placeholder="ABC-123"
                  maxLength={7}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  onKeyDown={e => e.key === "Enter" && handleJoinRoom()}
                  autoFocus
                />
                {error && <p className="text-xs font-bold text-black mb-3 bg-grey-light border border-black px-3 py-2 mt-2">{error}</p>}
                <button className="btn-brutal btn-primary w-full mt-4 mb-3" onClick={handleJoinRoom}>
                  Join Room
                </button>
                <button className="text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors" onClick={() => setStep({ id: "choose" })}>
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ── Step: loading ── */}
            {step.id === "loading" && (
              <motion.div key="loading" {...fadeSlide} className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-wider">{step.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const fadeSlide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.15 },
};

function ModeButton({ label, sub, icon, onClick, dark }: { label: string; sub: string; icon: React.ReactNode; onClick: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 border-2 border-black text-left transition-all ${
        dark ? "deck-btn-dark" : "deck-btn-light"
      }`}
      style={{ boxShadow: "3px 3px 0 #0a0a0a" }}
    >
      <span className="flex-shrink-0 opacity-70">{icon}</span>
      <span>
        <span className="block font-bold text-sm uppercase tracking-wider">{label}</span>
        <span className="block text-[10px] uppercase tracking-wider opacity-60 mt-0.5">{sub}</span>
      </span>
    </button>
  );
}

function RoomIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><rect x="2" y="8" width="16" height="10" /><path d="M6 8V5a4 4 0 0 1 8 0v3" /></svg>;
}
function JoinIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M13 10H3m0 0 4-4m-4 4 4 4M17 3v14" /></svg>;
}
function CpuIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><rect x="5" y="5" width="10" height="10" /><path d="M8 5V2m4 3V2M8 18v-3m4 3v-3M5 8H2m3 4H2m16-4h-3m3 4h-3" /></svg>;
}
