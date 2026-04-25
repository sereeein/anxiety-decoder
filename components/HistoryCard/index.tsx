// components/HistoryCard/index.tsx
'use client';

import Link from 'next/link';

interface HistoryCardProps {
  id: string;
  headline: string | null;
  primaryAction: string | null;
  createdAt: string;
  realCount: number;
  catastrophicCount: number;
  fogCount: number;
  feedbackEmoji: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryCard({
  id,
  headline,
  primaryAction,
  createdAt,
  realCount,
  catastrophicCount,
  fogCount,
  feedbackEmoji,
}: HistoryCardProps) {
  return (
    <Link
      href={`/card/${id}`}
      className="block rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-handwriting-cn text-lg text-[var(--text)] leading-snug">
          {headline ?? '（无标题）'}
        </h3>
        {feedbackEmoji && <span className="text-xl">{feedbackEmoji}</span>}
      </div>
      {primaryAction && (
        <p className="text-xs text-[var(--text-muted)] mb-3">→ {primaryAction}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="font-handwriting-en text-sm">{fmtDate(createdAt)}</span>
        <span>·</span>
        <span className="text-[var(--bucket-real)]">🟢 <span className="font-handwriting-en">{realCount}</span></span>
        <span className="text-[var(--bucket-catastrophic)]">🟡 <span className="font-handwriting-en">{catastrophicCount}</span></span>
        <span className="text-[var(--bucket-fog)]">⚪ <span className="font-handwriting-en">{fogCount}</span></span>
      </div>
    </Link>
  );
}
