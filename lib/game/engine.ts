import type { ResolvedCard, StatDefinition } from "@/types";

export interface RoundResult {
  winner_player_id: string | null; // null = tie
  tied_player_ids: string[];
  values: Record<string, number>; // player_id -> stat value
}

/**
 * Compare all players' top cards on a given stat.
 * Returns the winner (or null if tied), plus tied player ids.
 */
export function compareCards(
  playerCards: Record<string, ResolvedCard>, // player_id -> their top card
  stat: StatDefinition
): RoundResult {
  const values: Record<string, number> = {};

  for (const [playerId, card] of Object.entries(playerCards)) {
    values[playerId] = card.stats[stat.name] ?? 0;
  }

  const entries = Object.entries(values);
  const best = stat.is_inverse
    ? Math.min(...entries.map(([, v]) => v))
    : Math.max(...entries.map(([, v]) => v));

  const winners = entries.filter(([, v]) => v === best).map(([id]) => id);

  return {
    winner_player_id: winners.length === 1 ? winners[0] : null,
    tied_player_ids: winners.length > 1 ? winners : [],
    values,
  };
}

/**
 * Shuffle an array in-place using Fisher-Yates.
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal cards evenly to players.
 * Returns a map of player_id -> ordered card ids (index 0 = top of deck).
 */
export function dealCards(
  cardIds: string[],
  playerIds: string[]
): Record<string, string[]> {
  const shuffled = shuffle(cardIds);
  const hands: Record<string, string[]> = {};

  playerIds.forEach((id) => (hands[id] = []));

  shuffled.forEach((cardId, i) => {
    const playerId = playerIds[i % playerIds.length];
    hands[playerId].push(cardId);
  });

  return hands;
}

/**
 * Pick a random stat id from a card's available stats.
 * Used for AI (random mode) and auto-pick on timer expiry.
 */
export function pickRandomStat(card: ResolvedCard, statDefs: StatDefinition[]): StatDefinition {
  return statDefs[Math.floor(Math.random() * statDefs.length)];
}
