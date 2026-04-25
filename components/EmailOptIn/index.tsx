// components/EmailOptIn/index.tsx
'use client';

import { useState } from 'react';
import DelaySelector from '@/components/DelaySelector';
import { useSparkleOnMobile } from '@/hooks/useSparkleOnMobile';

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
  const { spark, portal } = useSparkleOnMobile();

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
    <aside className="rounded-3xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 mt-4">
      {portal}
      <p className="text-sm text-[var(--text)]">
        想让我 <span className="font-handwriting-en text-base text-[var(--accent)]">{delayDays} 天</span> 后问问你"那件事发生了吗"？留个邮箱就行。不留也可以。
      </p>
      <DelaySelector value={delayDays} onChange={setDelayDays} />
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-xl bg-white border-2 border-[var(--input-border)] focus:border-[var(--input-border-focus)] outline-none transition-colors duration-150 px-3 py-2 text-sm text-[var(--text)]"
        />
        <button
          type="button"
          onClick={(e) => {
            spark(e);
            handleSubmit();
          }}
          disabled={busy || !email.trim()}
          className="rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {busy ? '…' : '好'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="self-start text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
      >
        不留邮箱，继续
      </button>
    </aside>
  );
}
