"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { useSession } from "@/hooks/useSession";
import type { Deck } from "@/types";
import Image from "next/image";

interface LobbyProps {
  roomCode: string;
  deck: Deck;
}

export function Lobby({ roomCode, deck }: LobbyProps) {
  const router = useRouter();
  const session = useSession();
  const { room, players, loading, amHost, leaveRoom } = useRoom(roomCode, session?.playerId ?? null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

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

  const humanPlayers = players.filter(p => !p.is_ai);
  const aiPlayers = players.filter(p => p.is_ai);
  const isFull = players.length >= room.max_players;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${roomCode}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startGame() {
    setStarting(true);
    const res = await fetch(`/api/game/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: session!.playerId }),
    });
    if (!res.ok) { setStarting(false); }
    // Room status update triggers a re-render via Realtime and the page will switch to game view
  }

  async function handleLeave() {
    if (session) await leaveRoom(session.playerId);
    router.push("/");
  }

  const displayCode = `${roomCode.slice(0, 3)}-${roomCode.slice(3)}`;

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
            {/* Room code */}
            <div className="flex items-center gap-3 mb-4">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-grey-dark font-bold mb-1">Room Code</p>
                <span className="room-code text-2xl">{displayCode}</span>
              </div>
              <button
                onClick={copyLink}
                className="btn-brutal btn-secondary text-[10px] px-3 py-2 ml-2"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isFull ? "bg-black" : "bg-grey-mid"}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-grey-dark">
                {players.length} / {room.max_players} players
                {isFull ? " — Room full" : " — Waiting for players"}
              </span>
            </div>
          </div>
        </div>

        {/* Player list */}
        <div className="panel-brutal mb-6">
          <div className="px-4 py-2 border-b-2 border-black bg-grey-light">
            <p className="text-[10px] font-bold uppercase tracking-widest text-grey-dark">Players</p>
          </div>
          <div className="divide-y-2 divide-grey-light">
            <AnimatePresence>
              {players.map((p, i) => (
                <motion.div
                  key={p.player_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 border-2 border-black overflow-hidden flex-shrink-0 bg-grey-light">
                    {p.avatar_url && (
                      <Image src={p.avatar_url} alt={p.room_username} width={36} height={36} className="object-cover" />
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm truncate block">{p.room_username}</span>
                    <div className="flex gap-1.5 mt-0.5">
                      {p.is_host && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-black text-white px-1.5 py-0.5">HOST</span>
                      )}
                      {p.is_ai && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-grey-light border border-black text-black px-1.5 py-0.5">CPU</span>
                      )}
                      {p.player_id === session.playerId && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-grey-dark px-1 py-0.5">You</span>
                      )}
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

        {/* Start button (host only) */}
        {amHost && (
          <div>
            <button
              className="btn-brutal btn-primary w-full text-base py-4"
              disabled={!isFull || starting}
              onClick={startGame}
              style={{ opacity: isFull ? 1 : 0.4, cursor: isFull ? "pointer" : "not-allowed" }}
            >
              {starting ? "Starting..." : isFull ? "Start Game →" : `Waiting for ${room.max_players - players.length} more player(s)`}
            </button>
            {!isFull && (
              <p className="text-[10px] text-grey-mid text-center mt-2 uppercase tracking-wider">
                Share the room code or link above
              </p>
            )}
          </div>
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
