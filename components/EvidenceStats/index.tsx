// components/EvidenceStats/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import type { EvidenceStats } from '@/lib/core/evidenceStats';

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function EvidenceStatsPanel() {
  const [stats, setStats] = useState<EvidenceStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fp = getOrCreateFingerprint();
      try {
        const res = await fetch(`/api/stats?fingerprint=${encodeURIComponent(fp)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { stats: EvidenceStats };
        if (!cancelled) setStats(data.stats);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;
  if (stats.sessions === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        这里会慢慢积累你的证据 —— 解码一次以后再回来看。
      </p>
    );
  }

  return (
    <section className="rounded-3xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">
      <h3 className="font-handwriting-cn text-xl text-[var(--text)]">你的证据累积</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">累计解码次数</p>
          <p className="font-handwriting-en text-4xl text-[var(--text)]">{stats.sessions}</p>
        </div>
        {stats.catastrophicRespondedCount > 0 &&
          stats.catastrophicDidNotHappenRate !== null && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">灾难没发生的比例</p>
              <p className="font-handwriting-en text-4xl text-[var(--bucket-real)]">
                {pct(stats.catastrophicDidNotHappenRate)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                （<span className="font-handwriting-en text-sm">{stats.catastrophicRespondedCount}</span> 条已回答）
              </p>
            </div>
          )}
        {stats.positiveRate !== null && (
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">🙂 反馈率</p>
            <p className="font-handwriting-en text-4xl text-[var(--text)]">{pct(stats.positiveRate)}</p>
          </div>
        )}
        {stats.manualEditRate !== null && (
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">手动修正分类比例</p>
            <p className="font-handwriting-en text-4xl text-[var(--text)]">{pct(stats.manualEditRate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
