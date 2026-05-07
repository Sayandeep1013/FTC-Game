import type { ResolvedCard, StatDefinition } from "@/types";
import { pickRandomStat } from "./engine";

/**
 * AI stat selection — random difficulty (current implementation).
 * Future: add medium/hard/strategic modes here.
 */
export function aiPickStat(
  card: ResolvedCard,
  statDefs: StatDefinition[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _difficulty: "random" = "random"
): StatDefinition {
  return pickRandomStat(card, statDefs);
}
