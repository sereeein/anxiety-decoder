// app/decode/[sessionId]/result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DecodeCard, { type DecodeCardWorry } from '@/components/DecodeCard';
import EmailOptIn from '@/components/EmailOptIn';
import type { WorryCategory } from '@/lib/db/worryItems';

interface SessionPayload {
  primary_action: string | null;
  card_headline: string | null;
  worries: DecodeCardWorry[];
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launchBusy, setLaunchBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error(`session ${res.status}`);
        const payload = (await res.json()) as SessionPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError('加载失败，刷新试试？');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleReclassify = async (worryId: string, next: WorryCategory) => {
    if (!data) return;
    setData({
      ...data,
      worries: data.worries.map((w) => (w.id === worryId ? { ...w, category: next } : w)),
    });
    try {
      await fetch(`/api/sessions/${sessionId}/worries/${worryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: next }),
      });
    } catch {
      // MVP: ignore, reconcile on reload
    }
  };

  const handleLaunch = async () => {
    setLaunchBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/launch`, { method: 'POST' });
      router.push(`/decode/${sessionId}/wait`);
    } catch {
      setError('AI 走神了，再来一次？');
      setLaunchBusy(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
        <p className="text-rose-600 text-sm">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
        <p className="text-stone-500 text-sm">解码中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="mx-auto max-w-xl">
        <DecodeCard
          headline={data.card_headline}
          primaryAction={data.primary_action}
          worries={data.worries}
          onReclassify={handleReclassify}
          onLaunch={handleLaunch}
          launchBusy={launchBusy}
        />
        <EmailOptIn
          sessionId={sessionId}
          hasCatastrophic={data.worries.some((w) => w.category === 'catastrophic')}
          onSubmitted={() => { /* no-op; component hides itself */ }}
        />
      </div>
    </main>
  );
}
