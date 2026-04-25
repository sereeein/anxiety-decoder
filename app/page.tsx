// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OpeningRitual from '@/components/OpeningRitual';
import WorryInput from '@/components/WorryInput';
import PendingBanner from '@/components/PendingBanner';
import { getOrCreateFingerprint } from '@/lib/fingerprint';

export default function LandingPage() {
  const router = useRouter();
  const [ritualDone, setRitualDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (dump: string) => {
    setBusy(true);
    setError(null);
    try {
      const fingerprint = getOrCreateFingerprint();
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, dump }),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/decode/${sessionId}`);
    } catch {
      setError('AI 走神了，再来一次？');
      setBusy(false);
    }
  };

  if (!ritualDone) {
    return <OpeningRitual onComplete={() => setRitualDone(true)} />;
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <a
        href="/history"
        className="fixed top-4 right-4 text-xs text-stone-500 hover:text-stone-700 underline"
      >
        过往的解码 →
      </a>
      <div className="w-full max-w-xl">
        <h1 className="mb-4 text-stone-700 text-lg">你现在在回避什么？</h1>
        <WorryInput onSubmit={handleSubmit} busy={busy} />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
      <PendingBanner />
    </main>
  );
}
