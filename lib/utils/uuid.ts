/**
 * Cross-browser UUID v4 generator.
 * Uses crypto.randomUUID() when available (modern browsers, secure contexts).
 * Falls back to a Math.random-based RFC 4122 v4 UUID for older mobile browsers
 * (iOS Safari < 15.4, older Android Chrome, non-HTTPS dev environments).
 */
export function randomUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return (crypto as Crypto).randomUUID();
  }
  // RFC 4122 v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
