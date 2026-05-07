"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getPresetAvatar, getRandomPresetAvatar } from "@/lib/utils/avatar";

export interface PlayerSession {
  playerId: string;
  playerType: "guest" | "user";
  avatarUrl: string;
}

export function useSession(): PlayerSession | null {
  const { user, loading } = useAuth();
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setSession({
        playerId: user.id,
        playerType: "user",
        avatarUrl: (user.user_metadata?.avatar_url as string) ?? getRandomPresetAvatar(),
      });
    } else {
      let id = sessionStorage.getItem("ftc_pid");
      let avatar = sessionStorage.getItem("ftc_avatar");
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem("ftc_pid", id);
      }
      if (!avatar) {
        avatar = getPresetAvatar(id); // deterministic from session ID
        sessionStorage.setItem("ftc_avatar", avatar);
      }
      setSession({ playerId: id, playerType: "guest", avatarUrl: avatar });
    }
  }, [user, loading]);

  return session;
}
