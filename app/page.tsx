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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex flex-col gap-3 text-center">
          <h1 className="font-handwriting-cn text-3xl md:text-4xl leading-tight text-[var(--text)]">
            {c.headline}
          </h1>
          {c.subheadline && (
            <p className="text-base text-[var(--text-muted)] max-w-md mx-auto">
              {c.subheadline}
            </p>
          )}
        </header>
        <WorryInput
          onSubmit={submit}
          busy={busy}
          placeholder={c.placeholder}
          privacyLine={c.privacyLine}
        />
        {error && (
          <RetryError message={error} onRetry={handleRetry} busy={busy} />
        )}
      </div>
      <PendingBanner />
    </main>
  );
}
