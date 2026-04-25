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
    <div className="fixed bottom-4 right-4 max-w-sm rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col gap-2">
      <p className="text-sm text-stone-700">
        你还有 <span className="font-medium">{count}</span> 条担心等着回来看一眼。
      </p>
      <div className="flex gap-2">
        <a
          href={`/verify/${firstToken}`}
          className="rounded-md bg-stone-800 px-3 py-1 text-xs text-white hover:bg-stone-700"
        >
          回答第一条
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-stone-500 hover:text-stone-700"
        >
          稍后
        </button>
      </div>
    </div>
  );
}
