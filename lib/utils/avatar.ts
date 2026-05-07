const GUEST_AVATARS = [
  "/avatars/guest-1.svg",
  "/avatars/guest-2.svg",
  "/avatars/guest-3.svg",
  "/avatars/guest-4.svg",
  "/avatars/guest-5.svg",
];

/** Pick a deterministic avatar from the guest pool based on a seed string */
export function getPresetAvatar(seed: string): string {
  // Simple hash so the same player_id always gets the same avatar
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GUEST_AVATARS[hash % GUEST_AVATARS.length];
}

/** Fallback for when no seed is available */
export function getRandomPresetAvatar(): string {
  return GUEST_AVATARS[Math.floor(Math.random() * GUEST_AVATARS.length)];
}

export function getPresetAvatarList(): string[] {
  return [...GUEST_AVATARS];
}
