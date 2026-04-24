// components/CategoryChip/index.tsx
'use client';

import { useState } from 'react';
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

export default function CategoryChip({ category, onReclassify }: CategoryChipProps) {
  const [open, setOpen] = useState(false);
  const others = (Object.keys(LABELS) as WorryCategory[]).filter((c) => c !== category);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 hover:border-stone-400"
      >
        {LABELS[category]}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-col rounded-md border border-stone-200 bg-white shadow-sm">
          {others.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => {
                setOpen(false);
                onReclassify(c);
              }}
              className="px-3 py-1 text-left text-xs text-stone-700 hover:bg-stone-100"
            >
              移到 {LABELS[c]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
