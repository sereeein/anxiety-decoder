// app/decode/[sessionId]/result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import DecodeCard, { type DecodeCardWorry } from '@/components/DecodeCard';
import EmailOptIn from '@/components/EmailOptIn';
import RetryError from '@/components/RetryError';
import type { WorryCategory } from '@/lib/db/worryItems';
import { retryOnce } from '@/lib/retry';

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
  const [launchError, setLaunchError] = useState<string | null>(null);
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
    setLaunchError(null);
    try {
      await retryOnce(async () => {
        const res = await fetch(`/api/sessions/${sessionId}/launch`, { method: 'POST' });
        if (!res.ok) throw new Error(`launch ${res.status}`);
        router.push(`/decode/${sessionId}/wait`);
      });
    } catch {
      setLaunchError('AI 走神了，再来一次？');
      setLaunchBusy(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <p className="text-base text-[var(--bucket-catastrophic)]">{error}</p>
      </main>
    );
  }
  if (!data || !data.card_headline || !data.primary_action) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <p className="font-handwriting-cn text-xl text-[var(--text-muted)]">解码中…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <Image
          src="/illustrations/02-decode-card.png"
          alt="一只白色小猫专注地看着三张小色卡"
          width={400}
          height={400}
          className="w-56 md:w-64 h-auto mx-auto"
        />
        <DecodeCard
          headline={data.card_headline}
          primaryAction={data.primary_action}
          worries={data.worries}
          onReclassify={handleReclassify}
          onLaunch={handleLaunch}
          launchBusy={launchBusy}
        />
        {launchError && (
          <RetryError message={launchError} onRetry={handleLaunch} busy={launchBusy} />
        )}
        <EmailOptIn
          sessionId={sessionId}
          hasCatastrophic={data.worries.some((w) => w.category === 'catastrophic')}
          onSubmitted={() => { /* no-op; component hides itself */ }}
        />
      </div>
    </main>
  );
}
