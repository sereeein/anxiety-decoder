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
      className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-medium text-stone-800 leading-snug">
          {headline ?? '（无标题）'}
        </h3>
        {feedbackEmoji && <span className="text-xl">{feedbackEmoji}</span>}
      </div>
      {primaryAction && (
        <p className="text-xs text-stone-500 mb-3">→ {primaryAction}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span>{fmtDate(createdAt)}</span>
        <span>·</span>
        <span>🟢 {realCount}</span>
        <span>🟡 {catastrophicCount}</span>
        <span>⚪ {fogCount}</span>
      </div>
    </Link>
  );
}
