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
  onReclassify?: (worryId: string, next: WorryCategory) => void;
  onLaunch?: () => void;
  launchBusy?: boolean;
  readOnly?: boolean;
}

export default function DecodeCard({
  headline,
  primaryAction,
  worries,
  onReclassify,
  onLaunch,
  launchBusy,
  readOnly,
}: DecodeCardProps) {
  const real = worries.filter((w) => w.category === 'real');
  const catastrophic = worries.filter((w) => w.category === 'catastrophic');
  const fog = worries.filter((w) => w.category === 'fog');

  return (
    <article className="rounded-3xl bg-[var(--card-bg)] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-2 border-[var(--card-border)] flex flex-col gap-6">
      <header>
        <h2 className="font-handwriting-cn text-2xl text-[var(--text)] leading-snug">{headline}</h2>
      </header>

      <section className="rounded-2xl bg-[var(--accent-soft)] border-2 border-[var(--card-border)] p-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium text-[var(--bucket-real)]">🟢 真正要做的</h3>
        <ul className="flex flex-col gap-2">
          {real.map((w) => (
            <li key={w.id} className="flex items-start gap-2 text-sm text-[var(--text)]">
              <span className="flex-1">{w.content}</span>
              {readOnly ? (
                <span className="rounded-full border border-[var(--card-border)] bg-white px-2 py-1 text-xs text-[var(--text)]">
                  {w.category === 'real' ? '🟢 真问题' : w.category === 'catastrophic' ? '🟡 灾难化' : '⚪ 雾'}
                </span>
              ) : (
                <CategoryChip
                  category={w.category}
                  onReclassify={(next) => onReclassify?.(w.id, next)}
                />
              )}
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-xl bg-white border-2 border-[var(--card-border)] p-3">
          <p className="text-xs text-[var(--bucket-real)] mb-1">现在 5 分钟内能做的：</p>
          <p className="text-sm text-[var(--text)]">{primaryAction}</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={onLaunch}
            disabled={launchBusy}
            className="self-start rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {launchBusy ? '准备中…' : '现在做 5 分钟'}
          </button>
        )}
      </section>

      {catastrophic.length > 0 && (
        <section className="rounded-2xl bg-[#E8D5CE] border-2 border-[#D4B7AB] p-3 flex flex-col gap-2">
          <h3 className="text-xs text-[var(--bucket-catastrophic)]">🟡 灾难化想象（已记下，不在此刻处理）</h3>
          <ul className="flex flex-col gap-1">
            {catastrophic.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-[var(--text)]">
                <span className="flex-1">{w.content}</span>
                {readOnly ? (
                  <span className="rounded-full border border-[var(--card-border)] bg-white px-2 py-1 text-xs text-[var(--text)]">
                    {w.category === 'real' ? '🟢 真问题' : w.category === 'catastrophic' ? '🟡 灾难化' : '⚪ 雾'}
                  </span>
                ) : (
                  <CategoryChip
                    category={w.category}
                    onReclassify={(next) => onReclassify?.(w.id, next)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {fog.length > 0 && (
        <section className="rounded-2xl bg-[#E0DDD7] border-2 border-[#C9C5BD] p-3 flex flex-col gap-2">
          <h3 className="text-xs text-[var(--bucket-fog)]">⚪ 说不清的雾（已存档）</h3>
          <ul className="flex flex-col gap-1">
            {fog.map((w) => (
              <li key={w.id} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="flex-1">{w.content}</span>
                {readOnly ? (
                  <span className="rounded-full border border-[var(--card-border)] bg-white px-2 py-1 text-xs text-[var(--text)]">
                    {w.category === 'real' ? '🟢 真问题' : w.category === 'catastrophic' ? '🟡 灾难化' : '⚪ 雾'}
                  </span>
                ) : (
                  <CategoryChip
                    category={w.category}
                    onReclassify={(next) => onReclassify?.(w.id, next)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
