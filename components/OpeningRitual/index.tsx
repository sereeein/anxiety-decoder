// components/OpeningRitual/index.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { pickQuote, type PickedQuote } from '@/lib/core/quoteSelector';
import { pushQuoteHistory, readQuoteHistory } from '@/lib/quoteHistory';

interface OpeningRitualProps {
  onComplete: () => void;
}

const HOLD_MS = 1500;
const FADE_MS = 800; // longest leg: cat fades 600ms after a 200ms delay
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
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-[var(--bg)] text-[var(--text)] cursor-default"
    >
      {picked && (
        <>
          <motion.div
            animate={{ opacity: reducedMotion ? 1 : phase === 'fading' ? 0 : 1 }}
            transition={{ duration: 0.6, delay: phase === 'fading' ? 0.2 : 0 }}
            className="w-48 md:w-64"
          >
            <Image
              src="/illustrations/01-opening-ritual.png"
              alt="一只小猫安静地盘腿坐着，闭着眼睛"
              width={400}
              height={533}
              priority
              className="w-full h-auto"
            />
          </motion.div>
          <motion.p
            animate={{ opacity: reducedMotion ? 1 : phase === 'fading' ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            className="font-handwriting-cn max-w-md px-6 text-center text-3xl leading-relaxed"
          >
            {picked.quote}
          </motion.p>
        </>
      )}
      <span className="sr-only">跳过</span>
    </button>
  );
}
