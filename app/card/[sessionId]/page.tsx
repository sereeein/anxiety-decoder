// app/card/[sessionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DecodeCard, { type DecodeCardWorry } from '@/components/DecodeCard';
import ScreenshotButton from '@/components/ScreenshotButton';

interface SessionPayload {
  primary_action: string | null;
  card_headline: string | null;
  worries: DecodeCardWorry[];
}

export default function CardDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const payload = (await res.json()) as SessionPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError('卡片不存在或已删除');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <p className="font-handwriting-cn text-xl text-[var(--text-muted)]">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <p className="font-handwriting-cn text-xl text-[var(--text-muted)]">加载中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <a
            href="/history"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
          >
            ← 过往的解码
          </a>
          <ScreenshotButton
            targetSelector="#decode-card-root"
            fileName={`anxiety-decoder-${sessionId}.png`}
          />
        </div>
        <div id="decode-card-root">
          <DecodeCard
            headline={data.card_headline}
            primaryAction={data.primary_action}
            worries={data.worries}
            readOnly
          />
        </div>
        <a
          href="/"
          className="self-center text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
        >
          回到首页
        </a>
      </div>
    </main>
  );
}
