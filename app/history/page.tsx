// app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import HistoryCard from '@/components/HistoryCard';
import EvidenceStatsPanel from '@/components/EvidenceStats';

interface SessionRow {
  id: string;
  created_at: string;
  card_headline: string | null;
  primary_action: string | null;
  real_count: number;
  catastrophic_count: number;
  fog_count: number;
  feedback_emoji: string | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fp = getOrCreateFingerprint();
      const res = await fetch(`/api/sessions?fingerprint=${encodeURIComponent(fp)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: SessionRow[] };
      if (!cancelled) setSessions(data.sessions);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-stone-800">过往的解码</h1>
          <a href="/" className="text-sm text-stone-500 underline">
            回到首页
          </a>
        </header>

        <EvidenceStatsPanel />

        {sessions === null && <p className="text-sm text-stone-500">加载中…</p>}
        {sessions !== null && sessions.length === 0 && (
          <p className="text-sm text-stone-500">
            还没有解码记录 —— 做完第一次就会出现在这里。
          </p>
        )}
        {sessions !== null && sessions.length > 0 && (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <HistoryCard
                key={s.id}
                id={s.id}
                headline={s.card_headline}
                primaryAction={s.primary_action}
                createdAt={s.created_at}
                realCount={s.real_count}
                catastrophicCount={s.catastrophic_count}
                fogCount={s.fog_count}
                feedbackEmoji={s.feedback_emoji}
              />
            ))}
          </div>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-4">
          <a href="/settings/data" className="text-xs text-stone-500 underline">
            数据管理 / 删除我的数据
          </a>
        </footer>
      </div>
    </main>
  );
}
