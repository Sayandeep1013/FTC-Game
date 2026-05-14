"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { randomUUID } from "@/lib/utils/uuid";

export interface ChatMessage {
  id: string;
  player_id: string;
  username: string;
  text: string;
  ts: number; // Date.now()
  isSystem?: boolean;
}

export function useChat(
  roomCode: string,
  playerId: string | null,
  username: string | null
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${roomCode}`, {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages(prev => {
          // Deduplicate by id (broadcast can fire twice on reconnect)
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, playerId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!channelRef.current || !playerId || !username) return;
      const msg: ChatMessage = {
        id: randomUUID(),
        player_id: playerId,
        username,
        text: text.trim(),
        ts: Date.now(),
      };
      await channelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: msg,
      });
    },
    [playerId, username]
  );

  const sendSystem = useCallback(
    async (text: string) => {
      if (!channelRef.current) return;
      const msg: ChatMessage = {
        id: randomUUID(),
        player_id: "system",
        username: "System",
        text,
        ts: Date.now(),
        isSystem: true,
      };
      await channelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: msg,
      });
    },
    []
  );

  return { messages, sendMessage, sendSystem };
}
