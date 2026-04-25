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
      <p className="text-sm text-stone-500">
        这里会慢慢积累你的证据 —— 解码一次以后再回来看。
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
      <h3 className="text-sm font-medium text-stone-700">你的证据累积</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-stone-500 mb-1">累计解码次数</p>
          <p className="text-2xl font-medium text-stone-800">{stats.sessions}</p>
        </div>
        {stats.catastrophicRespondedCount > 0 &&
          stats.catastrophicDidNotHappenRate !== null && (
            <div>
              <p className="text-xs text-stone-500 mb-1">灾难没发生的比例</p>
              <p className="text-2xl font-medium text-emerald-700">
                {pct(stats.catastrophicDidNotHappenRate)}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                （{stats.catastrophicRespondedCount} 条已回答）
              </p>
            </div>
          )}
        {stats.positiveRate !== null && (
          <div>
            <p className="text-xs text-stone-500 mb-1">🙂 反馈率</p>
            <p className="text-2xl font-medium text-stone-800">{pct(stats.positiveRate)}</p>
          </div>
        )}
        {stats.manualEditRate !== null && (
          <div>
            <p className="text-xs text-stone-500 mb-1">手动修正分类比例</p>
            <p className="text-2xl font-medium text-stone-800">{pct(stats.manualEditRate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
