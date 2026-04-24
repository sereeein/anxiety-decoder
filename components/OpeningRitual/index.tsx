// components/OpeningRitual/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { pickQuote, type PickedQuote } from '@/lib/core/quoteSelector';
import { pushQuoteHistory, readQuoteHistory } from '@/lib/quoteHistory';

interface OpeningRitualProps {
  onComplete: () => void;
}

const HOLD_MS = 1500;
const FADE_MS = 500;
const REDUCED_HOLD_MS = 1000;

export default function OpeningRitual({ onComplete }: OpeningRitualProps) {
  const [picked, setPicked] = useState<PickedQuote | null>(null);
  const [phase, setPhase] = useState<'hold' | 'fading'>('hold');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Quote pick + motion preference are client-only.
  // Running them in render (or useMemo) causes SSR/client hydration mismatch
  // because Math.random and localStorage differ between server and client.
  useEffect(() => {
    const recent = readQuoteHistory();
    const result = pickQuote(recent);
    pushQuoteHistory(result.index);
    setPicked(result);
    setReducedMotion(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    );
  }, []);

  useEffect(() => {
    if (!picked) return;
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
  }, [picked, reducedMotion, onComplete]);

  return (
    <button
      type="button"
      aria-label="跳过"
      onClick={onComplete}
      className="fixed inset-0 flex items-center justify-center bg-stone-50 text-stone-700 cursor-default"
    >
      {picked && (
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
      )}
    </button>
  );
}
