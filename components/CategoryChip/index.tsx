// components/CategoryChip/index.tsx
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WorryCategory } from '@/lib/db/worryItems';

const LABELS: Record<WorryCategory, string> = {
  real: '🟢 真问题',
  catastrophic: '🟡 灾难化',
  fog: '⚪ 雾',
};

interface CategoryChipProps {
  category: WorryCategory;
  onReclassify: (next: WorryCategory) => void;
}

const CHIP_CLASSES: Record<WorryCategory, string> = {
  real: 'text-[var(--bucket-real)] bg-[var(--accent-soft)] border-[var(--card-border)]',
  catastrophic: 'text-[var(--bucket-catastrophic)] bg-[#E8D5CE] border-[#D4B7AB]',
  fog: 'text-[var(--bucket-fog)] bg-[#E0DDD7] border-[#C9C5BD]',
};

export default function CategoryChip({ category, onReclassify }: CategoryChipProps) {
  const [open, setOpen] = useState(false);
  const others = (Object.keys(LABELS) as WorryCategory[]).filter((c) => c !== category);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative overflow-hidden rounded-full border-2 px-2 py-1 text-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ${CHIP_CLASSES[category]}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={category}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
            className="inline-block"
          >
            {LABELS[category]}
          </motion.span>
        </AnimatePresence>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-col rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
          {others.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => {
                setOpen(false);
                onReclassify(c);
              }}
              className="px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors duration-150"
            >
              移到 {LABELS[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
