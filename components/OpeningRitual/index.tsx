// components/OpeningRitual/index.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { pickQuote } from '@/lib/core/quoteSelector';
import { pushQuoteHistory, readQuoteHistory } from '@/lib/quoteHistory';

interface OpeningRitualProps {
  onComplete: () => void;
}

const HOLD_MS = 1500;
const FADE_MS = 500;
const REDUCED_HOLD_MS = 1000;

export default function OpeningRitual({ onComplete }: OpeningRitualProps) {
  const [phase, setPhase] = useState<'hold' | 'fading'>('hold');

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  const picked = useMemo(() => {
    const recent = readQuoteHistory();
    const result = pickQuote(recent);
    pushQuoteHistory(result.index);
    return result;
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, REDUCED_HOLD_MS);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase('fading'), HOLD_MS);
    const t2 = setTimeout(onComplete, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete, reducedMotion]);

  return (
    <button
      type="button"
      aria-label="跳过"
      onClick={onComplete}
      className="fixed inset-0 flex items-center justify-center bg-stone-50 text-stone-700 cursor-default"
    >
      <p
        className={`max-w-md px-6 text-center text-2xl font-medium leading-relaxed transition-opacity ${
          reducedMotion
            ? 'opacity-100'
            : phase === 'hold'
            ? 'opacity-100 duration-700'
            : 'opacity-0 duration-500'
        }`}
      >
        {picked.quote}
      </p>
    </button>
  );
}
