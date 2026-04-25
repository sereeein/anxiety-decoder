// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import OpeningRitual from '@/components/OpeningRitual';
import WorryInput from '@/components/WorryInput';
import PendingBanner from '@/components/PendingBanner';
import RetryError from '@/components/RetryError';
import { getOrCreateFingerprint } from '@/lib/fingerprint';
import { retryOnce } from '@/lib/retry';
import { COPY_A, pickCopy, type LandingCopy } from '@/lib/landingCopy';

export default function LandingPage() {
  const router = useRouter();
  const [ritualDone, setRitualDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copy, setCopy] = useState<LandingCopy | null>(null);
  const lastDumpRef = useRef<string | null>(null);

  useEffect(() => {
    const picked = pickCopy(getOrCreateFingerprint());
    setCopy(picked);
    console.log('[landing-copy] variant:', picked.variant);
  }, []);

  const submit = async (dump: string) => {
    setBusy(true);
    setError(null);
    lastDumpRef.current = dump;
    try {
      await retryOnce(async () => {
        const fingerprint = getOrCreateFingerprint();
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint, dump }),
        });
        if (!res.ok) throw new Error(`server returned ${res.status}`);
        const { sessionId } = (await res.json()) as { sessionId: string };
        router.push(`/decode/${sessionId}`);
      });
    } catch {
      setError('AI 走神了，再来一次？');
      setBusy(false);
    }
  };

  const handleRetry = () => {
    if (lastDumpRef.current) submit(lastDumpRef.current);
  };

  if (!ritualDone) {
    return <OpeningRitual onComplete={() => setRitualDone(true)} />;
  }

  // Render COPY_A defaults until fingerprint-driven pick resolves (avoids hydration mismatch).
  const c = copy ?? COPY_A;

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-stone-700 text-lg">{c.headline}</h1>
        {c.subheadline && (
          <p className="mb-4 text-sm text-stone-500">{c.subheadline}</p>
        )}
        <WorryInput
          onSubmit={submit}
          busy={busy}
          placeholder={c.placeholder}
          privacyLine={c.privacyLine}
        />
        {error && (
          <div className="mt-3">
            <RetryError message={error} onRetry={handleRetry} busy={busy} />
          </div>
        )}
      </div>
      <PendingBanner />
    </main>
  );
}
