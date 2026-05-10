const STORAGE_BASE =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/game-assets`;

function withCacheBust(url: string, version?: string | number | null): string {
  if (!version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}

/**
 * Resolve a card's display image URL.
 * Priority: Supabase Storage path > external URL > null (shows fallback in UI).
 */
export function getCardImageUrl(
  imageUrl: string | null | undefined,
  imageStoragePath: string | null | undefined,
  version?: string | number | null
): string | null {
  if (imageStoragePath) return withCacheBust(`${STORAGE_BASE}/${imageStoragePath}`, version);
  if (imageUrl) return withCacheBust(imageUrl, version);
  return null;
}

/**
 * Resolve a deck cover image URL.
 * Falls back to the slug-based convention in Supabase Storage.
 */
export function getDeckCoverUrl(
  coverImageUrl: string | null | undefined,
  slug: string,
  version?: string | number | null
): string | null {
  // No actual image — return null so the CSS pattern fallback renders immediately (no broken img flash)
  if (!coverImageUrl || coverImageUrl === "pending") return null;
  // User has uploaded an image to Storage at the conventional path — try that URL
  // (Only reaches here if dev manually set cover_image_url in the DB)
  // Full URL (external or Storage)
  if (coverImageUrl.startsWith("http")) return withCacheBust(coverImageUrl, version);
  // Relative storage path
  return withCacheBust(`${STORAGE_BASE}/${coverImageUrl}`, version);
}
