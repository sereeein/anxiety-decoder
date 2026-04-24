// tests/lib/core/quoteSelector.test.ts
import { describe, it, expect } from 'vitest';
import { pickQuote } from '@/lib/core/quoteSelector';
import { openingQuotes } from '@/data/openingQuotes';

describe('pickQuote', () => {
  it('returns a quote from the bank', () => {
    const result = pickQuote([], () => 0);
    expect(result.quote).toBe(openingQuotes[0]);
    expect(result.index).toBe(0);
  });

  it('avoids the last N indices when possible', () => {
    const recent = [0, 1, 2];
    const result = pickQuote(recent, () => 0.5);
    expect(recent).not.toContain(result.index);
  });

  it('falls back to picking from full bank when recent excludes everything', () => {
    const allButOne = openingQuotes.map((_, i) => i);
    const result = pickQuote(allButOne.slice(0, openingQuotes.length - 1), () => 0);
    expect(result.index).toBe(openingQuotes.length - 1);
  });

  it('returns a valid quote even when recent is larger than the bank', () => {
    const huge = Array.from({ length: 100 }, (_, i) => i % openingQuotes.length);
    const result = pickQuote(huge, () => 0);
    expect(openingQuotes).toContain(result.quote);
  });
});
