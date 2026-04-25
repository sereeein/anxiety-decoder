// components/EmailOptIn/index.tsx
'use client';

import { useState } from 'react';
import DelaySelector from '@/components/DelaySelector';

interface EmailOptInProps {
  sessionId: string;
  hasCatastrophic: boolean;
  onSubmitted: () => void;
}

export default function EmailOptIn({ sessionId, hasCatastrophic, onSubmitted }: EmailOptInProps) {
  const [email, setEmail] = useState('');
  const [delayDays, setDelayDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!hasCatastrophic) return null;

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), delayDays }),
      });
      onSubmitted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3 mt-4">
      <p className="text-sm text-stone-700">
        想让我 <span className="font-medium">{delayDays} 天</span> 后问问你"那件事发生了吗"？留个邮箱就行。不留也可以。
      </p>
      <DelaySelector value={delayDays} onChange={setDelayDays} />
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || !email.trim()}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '…' : '好'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="self-start text-xs text-stone-500 hover:text-stone-700"
      >
        不留邮箱，继续
      </button>
    </aside>
  );
}
