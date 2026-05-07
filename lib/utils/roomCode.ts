const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0, I/1 (confusing)

export function generateRoomCode(length = 6): string {
  return Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export function formatRoomCode(code: string): string {
  // Insert hyphen in the middle for readability: ABC-123
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
