// components/PendingBanner/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { getOrCreateFingerprint } from '@/lib/fingerprint';

export default function PendingBanner() {
  const [firstToken, setFirstToken] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const fp = getOrCreateFingerprint();
        const res = await fetch(`/api/sessions/pending?fingerprint=${encodeURIComponent(fp)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { count: number; tokens: string[] };
        if (cancelled) return;
        setCount(data.count);
        setFirstToken(data.tokens[0] ?? null);
      } catch {
        // silent
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || count === 0 || !firstToken) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2">
      <p className="text-sm text-[var(--text)]">
        你还有 <span className="font-handwriting-en text-base text-[var(--bucket-catastrophic)]">{count}</span> 条担心等着回来看一眼。
      </p>
      <div className="flex gap-2 items-center">
        <a
          href={`/verify/${firstToken}`}
          className="rounded-full bg-[var(--accent)] text-white px-4 py-1 text-xs hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
        >
          回答第一条
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
        >
          稍后
        </button>
      </div>
    </div>
  );
}
