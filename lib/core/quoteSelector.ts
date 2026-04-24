// lib/core/quoteSelector.ts
import { openingQuotes } from '@/data/openingQuotes';

export interface PickedQuote {
  quote: string;
  index: number;
}

/**
 * Pick a random quote, avoiding the most recent indices when possible.
 * Pure function — caller persists `recent` (typically last 3 indices in localStorage).
 *
 * @param recent  Indices to avoid (e.g. last 3 displayed).
 * @param rng     Defaults to Math.random; injectable for tests.
 */
export function pickQuote(
  recent: readonly number[],
  rng: () => number = Math.random,
): PickedQuote {
  const all = openingQuotes.map((_, i) => i);
  const recentSet = new Set(recent);
  const candidates = all.filter((i) => !recentSet.has(i));
  const pool = candidates.length > 0 ? candidates : all;
  const index = pool[Math.floor(rng() * pool.length)];
  return { quote: openingQuotes[index], index };
}
