"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/hooks/useAuth";
import type { Deck } from "@/types";

type Step =
  | { id: "username" }
  | { id: "choose" }
  | { id: "create" }
  | { id: "ai_count" }
  | { id: "join" }
  | { id: "loading"; message: string };

interface RoomModalProps {
  deck: Deck;
  onClose: () => void;
}

export function RoomModal({ deck, onClose }: RoomModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const session = useSession();

  const defaultName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";
  const [username, setUsername] = useState(defaultName);
  const [step, setStep] = useState<Step>({ id: "username" });
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [aiCount, setAiCount] = useState<2 | 3 | 4>(2); // total players incl. human
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const effectiveName = username.trim() || defaultName || "Player";

  async function createRoom(vsAi: boolean) {
    if (!session) return;
    setError("");
    setStep({ id: "loading", message: vsAi ? "Setting up match..." : "Creating room..." });

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deck_id: deck.id,
        max_players: vsAi ? aiCount : playerCount,
        player_id: session.playerId,
        player_type: session.playerType,
        room_username: effectiveName,
        avatar_url: session.avatarUrl,
        vs_ai: vsAi,
        ai_count: vsAi ? aiCount - 1 : 0,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setStep(vsAi ? { id: "ai_count" } : { id: "create" });
      return;
    }
    router.push(`/room/${data.room_code}`);
  }

  async function joinRoom() {
    const code = joinCode.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (code.length < 6) { setError("Enter the full 6-character code"); return; }
    if (!session) return;
    setError("");
    setStep({ id: "loading", message: "Joining room..." });

    const res = await fetch(`/api/rooms/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: session.playerId,
        player_type: session.playerType,
        room_username: effectiveName,
        avatar_url: session.avatarUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not join room");
      setStep({ id: "join" });
      return;
    }
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

            {/* ── Username ── */}
            {step.id === "username" && (
              <motion.div key="username" {...slide}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
                  Your display name for this session
                </label>
                <input
                  className="input-brutal mb-1"
                  placeholder={defaultName || "Enter a name..."}
                  maxLength={20}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setStep({ id: "choose" })}
                  autoFocus
                />
                <p className="text-[10px] text-grey-mid mb-5">
                  {user ? `Logged in as ${user.email}` : "Not unique — only visible in this session"}
                </p>
                <button className="btn-brutal btn-primary w-full" onClick={() => setStep({ id: "choose" })}>
                  Continue →
                </button>
              </motion.div>
            )}

            {/* ── Choose mode ── */}
            {step.id === "choose" && (
              <motion.div key="choose" {...slide}>
                <p className="text-[11px] uppercase tracking-widest text-grey-dark font-bold mb-4">
                  Playing as <span className="text-black">{effectiveName}</span>
                </p>
                <div className="flex flex-col gap-3">
                  <ModeBtn icon={<RoomIcon />} label="Create Room" sub="Host and share a code" onClick={() => setStep({ id: "create" })} />
                  <ModeBtn icon={<JoinIcon />} label="Join Room" sub="Enter a friend's room code" onClick={() => setStep({ id: "join" })} />
                  <ModeBtn icon={<CpuIcon />} label="Play vs AI" sub="1 human vs CPU opponents" onClick={() => setStep({ id: "ai_count" })} dark />
                </div>
                <button className="mt-4 text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors" onClick={() => setStep({ id: "username" })}>
                  ← Change name
                </button>
              </motion.div>
            )}

            {/* ── Create: pick player count ── */}
            {step.id === "create" && (
              <motion.div key="create" {...slide}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-3">Total players (including you)</p>
                <CountPicker value={playerCount} onChange={v => setPlayerCount(v as 2|3|4)} />
                {error && <ErrorBox msg={error} />}
                <button className="btn-brutal btn-primary w-full mt-4 mb-3" onClick={() => createRoom(false)}>
                  Create Room
                </button>
                <BackBtn onClick={() => setStep({ id: "choose" })} />
              </motion.div>
            )}

            {/* ── AI: pick total player count ── */}
            {step.id === "ai_count" && (
              <motion.div key="ai_count" {...slide}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-1">Total players</p>
                <p className="text-[10px] text-grey-mid mb-3">You + {aiCount - 1} CPU opponent{aiCount - 1 > 1 ? "s" : ""}</p>
                <CountPicker value={aiCount} onChange={v => setAiCount(v as 2|3|4)} />
                {error && <ErrorBox msg={error} />}
                <button className="btn-brutal btn-primary w-full mt-4 mb-3" onClick={() => createRoom(true)}>
                  Start vs AI →
                </button>
                <BackBtn onClick={() => setStep({ id: "choose" })} />
              </motion.div>
            )}

            {/* ── Join: enter code ── */}
            {step.id === "join" && (
              <motion.div key="join" {...slide}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">Room code</label>
                <input
                  className="input-brutal font-mono text-2xl text-center tracking-[0.4em] uppercase mb-1"
                  placeholder="ABC123"
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  onKeyDown={e => e.key === "Enter" && joinRoom()}
                  autoFocus
                />
                {error && <ErrorBox msg={error} />}
                <button className="btn-brutal btn-primary w-full mt-4 mb-3" onClick={joinRoom}>Join Room</button>
                <BackBtn onClick={() => setStep({ id: "choose" })} />
              </motion.div>
            )}

            {/* ── Loading ── */}
            {step.id === "loading" && (
              <motion.div key="loading" {...slide} className="py-10 text-center">
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

// ── Shared sub-components ─────────────────────────────────────────────────────

const slide = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.14 },
};

function CountPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3">
      {([2, 3, 4] as const).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 py-4 border-2 border-black font-display text-3xl transition-all ${
            value === n ? "bg-black text-white" : "bg-white text-black hover:bg-grey-light"
          }`}
          style={{ boxShadow: value === n ? "3px 3px 0 #4a4a44" : "3px 3px 0 #0a0a0a" }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ModeBtn({ icon, label, sub, onClick, dark }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 border-2 border-black text-left ${dark ? "deck-btn-dark" : "deck-btn-light"}`}
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

function ErrorBox({ msg }: { msg: string }) {
  return <p className="text-xs font-bold text-black mt-3 bg-grey-light border border-black px-3 py-2">{msg}</p>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors" onClick={onClick}>
      ← Back
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
