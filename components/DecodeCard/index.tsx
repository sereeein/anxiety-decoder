// components/DecodeCard/index.tsx
'use client';

import CategoryChip from '@/components/CategoryChip';
import type { WorryCategory } from '@/lib/db/worryItems';

export interface DecodeCardWorry {
  id: string;
  content: string;
  category: WorryCategory;
}

interface DecodeCardProps {
  headline: string;
  primaryAction: string;
  worries: DecodeCardWorry[];
  onReclassify: (worryId: string, next: WorryCategory) => void;
  onLaunch: () => void;
  launchBusy: boolean;
}

export default function DecodeCard({
  headline,
  primaryAction,
  worries,
  onReclassify,
  onLaunch,
  launchBusy,
}: DecodeCardProps) {
  const real = worries.filter((w) => w.category === 'real');
  const catastrophic = worries.filter((w) => w.category === 'catastrophic');
  const fog = worries.filter((w) => w.category === 'fog');

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm border border-stone-200 flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-medium text-stone-800 leading-snug">{headline}</h2>
      </header>

      <section className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium text-emerald-800">🟢 真正要做的</h3>
        <ul className="flex flex-col gap-2">
          {real.map((w) => (
            <li key={w.id} className="flex items-start gap-2 text-sm text-stone-800">
              <span className="flex-1">{w.content}</span>
              <CategoryChip
                category={w.category}
                onReclassify={(next) => onReclassify(w.id, next)}
              />
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-lg bg-white border border-emerald-200 p-3">
          <p className="text-xs text-emerald-700 mb-1">现在 5 分钟内能做的：</p>
          <p className="text-sm text-stone-800">{primaryAction}</p>
        </div>
        <button
          type="button"
          onClick={onLaunch}
          disabled={launchBusy}
          className="self-start rounded-full bg-emerald-700 px-5 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {launchBusy ? '准备中…' : '现在做 5 分钟'}
        </button>
      </section>

      {catastrophic.length > 0 && (
        <section className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex flex-col gap-2">
          <h3 className="text-xs text-amber-800">🟡 灾难化想象（已记下，不在此刻处理）</h3>
          <ul className="flex flex-col gap-1">
            {catastrophic.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-stone-700">
                <span className="flex-1">{w.content}</span>
                <CategoryChip
                  category={w.category}
                  onReclassify={(next) => onReclassify(w.id, next)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {fog.length > 0 && (
        <section className="rounded-xl bg-stone-50 border border-stone-200 p-3 flex flex-col gap-2">
          <h3 className="text-xs text-stone-600">⚪ 说不清的雾（已存档）</h3>
          <ul className="flex flex-col gap-1">
            {fog.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-stone-600">
                <span className="flex-1">{w.content}</span>
                <CategoryChip
                  category={w.category}
                  onReclassify={(next) => onReclassify(w.id, next)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
