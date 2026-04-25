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
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <p className="text-stone-500 text-sm">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <p className="text-stone-500 text-sm">加载中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <a href="/history" className="text-sm text-stone-500 underline">
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
      </div>
    </main>
  );
}
