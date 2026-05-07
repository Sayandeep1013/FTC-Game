"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/hooks/useAuth";
import type { Deck } from "@/types";
import Image from "next/image";

interface LobbyProps {
  roomCode: string;
  deck: Deck;
}

export function Lobby({ roomCode, deck }: LobbyProps) {
  const router = useRouter();
  const { user } = useAuth();
  const session = useSession();
  const { room, players, loading, amHost, leaveRoom } = useRoom(roomCode, session?.playerId ?? null);

  // Join prompt state
  const [joinName, setJoinName] = useState(
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? ""
  );
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [addingAi, setAddingAi] = useState(false);

  // Am I already in the room?
  const amInRoom = session ? players.some(p => p.player_id === session.playerId) : false;

  // If room status changed to "playing", navigate to game
  useEffect(() => {
    if (room?.status === "playing") {
      router.push(`/room/${roomCode}/game`);
    }
  }, [room?.status, roomCode, router]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading || !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="panel-brutal p-8 text-center max-w-sm">
          <p className="font-bold mb-4">Room not found or has closed.</p>
          <button className="btn-brutal btn-primary" onClick={() => router.push("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  // ── Join prompt (visitor not yet in room) ─────────────────────────────────
  if (!amInRoom) {
    async function handleJoin() {
      const name = joinName.trim() || (user ? "Player" : "Guest");
      if (!session) return;
      setJoining(true);
      setJoinError("");

      const res = await fetch(`/api/rooms/${roomCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.playerId,
          player_type: session.playerType,
          room_username: name,
          avatar_url: session.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error ?? "Could not join room");
        setJoining(false);
      }
      // On success: useRoom Realtime will re-fetch and amInRoom becomes true
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-brutal w-full max-w-sm"
        >
          <div className="bg-black px-5 py-3 border-b-2 border-black">
            <p className="font-display text-white text-xl tracking-widest">JOIN ROOM</p>
            <p className="text-grey-mid text-xs uppercase tracking-wider">{deck.name} · {roomCode.slice(0,3)}-{roomCode.slice(3)}</p>
          </div>

          <div className="p-5">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
              Your display name
            </label>
            <input
              className="input-brutal mb-1"
              placeholder={user ? (user.user_metadata?.full_name as string) || "Player" : "Guest name..."}
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              maxLength={20}
              autoFocus
            />
            {user && (
              <p className="text-[10px] text-grey-mid mb-4">Logged in as {user.email}</p>
            )}
            {joinError && (
              <p className="text-xs font-bold bg-grey-light border border-black px-3 py-2 mt-2 mb-3">{joinError}</p>
            )}
            <button
              className="btn-brutal btn-primary w-full mt-4"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? "Joining..." : "Join Room →"}
            </button>
            <button
              className="mt-3 text-[10px] uppercase tracking-wider text-grey-mid hover:text-black font-bold transition-colors w-full text-center"
              onClick={() => router.push("/")}
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Normal Lobby ─────────────────────────────────────────────────────────────

  const isFull = players.length >= room.max_players;
  const displayCode = `${roomCode.slice(0, 3)}-${roomCode.slice(3)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startGame() {
    setStarting(true);
    await fetch(`/api/game/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: session?.playerId }),
    });
    // Realtime will update room.status → "playing" → triggers router.push above
  }

  async function addAiPlayer() {
    if (isFull || !amHost) return;
    setAddingAi(true);
    await fetch(`/api/rooms/${roomCode}/ai-player`, { method: "POST" });
    setAddingAi(false);
  }

  function handleLeave() {
    // Navigate immediately — fire and forget
    router.push("/");
    fetch(`/api/rooms/${roomCode}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: session?.playerId }),
      keepalive: true,
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-16">

        {/* Room header */}
        <div className="panel-brutal mb-6">
          <div className="bg-black px-5 py-3 border-b-2 border-black flex items-center justify-between">
            <div>
              <span className="font-display text-white text-2xl tracking-wider">LOBBY</span>
              <span className="text-grey-mid text-xs ml-3 uppercase tracking-wider">{deck.name}</span>
            </div>
            <button onClick={handleLeave} className="deck-btn-dark text-xs px-3 py-1.5 font-bold uppercase tracking-wider border border-grey-dark">
              Leave
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-grey-dark font-bold mb-1">Room Code</p>
                <span className="room-code text-2xl">{displayCode}</span>
              </div>
              <button onClick={copyLink} className="btn-brutal btn-secondary text-[10px] px-3 py-2">
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isFull ? "bg-black" : "bg-grey-mid"}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-grey-dark">
                {players.length} / {room.max_players} · {isFull ? "Room full" : "Waiting for players"}
              </span>
            </div>
          </div>
        </div>

        {/* Player list */}
        <div className="panel-brutal mb-4">
          <div className="px-4 py-2 border-b-2 border-black bg-grey-light">
            <p className="text-[10px] font-bold uppercase tracking-widest text-grey-dark">Players</p>
          </div>
          <div className="divide-y-2 divide-grey-light">
            <AnimatePresence>
              {players.map((p, i) => (
                <motion.div
                  key={p.player_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-9 h-9 border-2 border-black overflow-hidden flex-shrink-0 bg-grey-light flex items-center justify-center">
                    {p.is_ai ? (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#4a4a44" strokeWidth="1.8" strokeLinecap="square">
                        <rect x="5" y="5" width="10" height="10" /><path d="M8 5V2m4 3V2M8 18v-3m4 3v-3M5 8H2m3 4H2m16-4h-3m3 4h-3" />
                      </svg>
                    ) : p.avatar_url ? (
                      <Image src={p.avatar_url} alt={p.room_username} width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <span className="font-display text-lg">{p.room_username[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm truncate block">{p.room_username}</span>
                    <div className="flex gap-1.5 mt-0.5">
                      {p.is_host && <Badge label="HOST" dark />}
                      {p.is_ai && <Badge label="CPU" />}
                      {p.player_id === session.playerId && <Badge label="YOU" muted />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {Array.from({ length: room.max_players - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 opacity-30">
                <div className="w-9 h-9 border-2 border-dashed border-black bg-grey-light" />
                <span className="text-xs uppercase tracking-wider font-bold text-grey-mid">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add AI button (host only) */}
        {amHost && !isFull && (
          <button
            onClick={addAiPlayer}
            disabled={addingAi}
            className="btn-brutal btn-secondary w-full mb-4 text-xs"
          >
            {addingAi ? "Adding..." : "+ Add CPU Player"}
          </button>
        )}
        {amHost && isFull && (
          <button disabled className="btn-brutal btn-secondary w-full mb-4 text-xs opacity-30 cursor-not-allowed">
            + Add CPU Player (room full)
          </button>
        )}

        {/* Start button (host only, room full) */}
        {amHost && (
          <button
            className="btn-brutal btn-primary w-full text-base py-4"
            disabled={!isFull || starting}
            onClick={startGame}
            style={{ opacity: isFull ? 1 : 0.4, cursor: isFull ? "pointer" : "not-allowed" }}
          >
            {starting ? "Starting..." : isFull ? "Start Game →" : `Need ${room.max_players - players.length} more player(s)`}
          </button>
        )}

        {!amHost && (
          <div className="panel-brutal px-5 py-4 text-center">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider font-bold text-grey-dark">Waiting for host to start...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ label, dark, muted }: { label: string; dark?: boolean; muted?: boolean }) {
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
      dark ? "bg-black text-white" :
      muted ? "text-grey-dark" :
      "bg-grey-light border border-black text-black"
    }`}>
      {label}
    </span>
  );
}
