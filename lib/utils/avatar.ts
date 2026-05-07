const PRESET_COUNT = 20;

export function getRandomPresetAvatar(): string {
  const index = Math.floor(Math.random() * PRESET_COUNT) + 1;
  return `/avatars/avatar-${String(index).padStart(2, "0")}.png`;
}

export function getPresetAvatarList(): string[] {
  return Array.from(
    { length: PRESET_COUNT },
    (_, i) => `/avatars/avatar-${String(i + 1).padStart(2, "0")}.png`
  );
}
