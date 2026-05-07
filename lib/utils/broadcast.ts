/**
 * Supabase Realtime Broadcast via REST API.
 * Sends a message directly to all subscribers of a channel in ~50ms,
 * without waiting for a DB write or Postgres Changes propagation.
 * Used as the fast path alongside Postgres Changes (which is the reliable fallback).
 * Only call from server-side code (API routes) — uses SUPABASE_SERVICE_ROLE_KEY.
 */
export async function broadcast(
  channel: string,
  event: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [{
          topic: `realtime:${channel}`,   // Supabase channels are internally prefixed with "realtime:"
          event,
          payload,
        }],
      }),
    });
  } catch {
    // Non-critical — Postgres Changes is the reliable fallback
  }
}

// Channel name helpers — keep naming consistent between server and client
export const gameCh  = (roomCode: string) => `game:${roomCode}`;
export const lobbyCh = (roomCode: string) => `room-lobby-${roomCode}`;
