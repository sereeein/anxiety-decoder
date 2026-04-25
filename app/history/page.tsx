// app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
    <main className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <Image
          src="/illustrations/05-history.png"
          alt="一只白色小猫坐在三只玻璃罐旁边"
          width={600}
          height={400}
          className="w-full max-w-md mx-auto md:max-w-lg h-auto"
        />
        <header className="flex flex-col gap-2">
          <h1 className="font-handwriting-cn text-3xl md:text-4xl text-[var(--text)]">
            过往的解码
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            把每一次解码留下来，看清楚它们后来发生了没有。
          </p>
        </header>

        <EvidenceStatsPanel />

        {sessions === null && (
          <p className="font-handwriting-cn text-lg text-[var(--text-muted)] text-center py-8">
            加载中…
          </p>
        )}
        {sessions !== null && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="font-handwriting-cn text-2xl text-[var(--text)]">
              还没有解码记录
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              做完第一次就会出现在这里。
            </p>
          </div>
        )}
        {sessions !== null && sessions.length > 0 && (
          <div className="flex flex-col gap-4">
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

        <footer className="mt-4 border-t border-[var(--card-border)] pt-6">
          <a
            href="/settings/data"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
          >
            数据管理 / 删除我的数据
          </a>
        </footer>
      </div>
    </main>
  );
}
