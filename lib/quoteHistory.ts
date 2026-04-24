// lib/quoteHistory.ts
const KEY = 'anxiety_decoder_quote_history';
const MAX = 3;

export function readQuoteHistory(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function pushQuoteHistory(index: number): void {
  if (typeof window === 'undefined') return;
  const current = readQuoteHistory();
  const next = [index, ...current.filter((n) => n !== index)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
