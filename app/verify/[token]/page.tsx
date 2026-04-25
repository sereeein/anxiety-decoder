// app/verify/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface VerifyPayload {
  scheduled_for: string;
  responded_at: string | null;
  did_happen: boolean | null;
}

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [didHappen, setDidHappen] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/verify/${token}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as VerifyPayload;
        if (!cancelled) setPayload(data);
      } catch {
        if (!cancelled) setError('链接失效或已过期');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (didHappen === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ didHappen, userNote: note }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setDone(true);
    } catch {
      setError('提交失败，再试一次？');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-4">
        <p className="font-handwriting-cn text-2xl md:text-3xl text-[var(--text)]">
          链接失效
        </p>
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </main>
    );
  }
  if (!payload) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <p className="font-handwriting-cn text-xl text-[var(--text-muted)]">加载中…</p>
      </main>
    );
  }
  if (payload.responded_at) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-4">
        <p className="font-handwriting-cn text-2xl md:text-3xl text-[var(--text)]">
          这条已经回答过了。
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          你当时的回答是：{payload.did_happen ? '发生了' : '没发生'}
        </p>
      </main>
    );
  }
  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
        <p className="font-handwriting-cn text-3xl text-[var(--text)]">收到。</p>
        <a
          href="/"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
        >
          回到首页
        </a>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">
        <p className="font-handwriting-cn text-2xl md:text-3xl text-center text-[var(--text)] leading-relaxed">
          你当时担心的那件事 —— 真的发生了吗？
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setDidHappen(false)}
            className={`rounded-full px-6 py-3 text-sm transition-all duration-150 ${
              didHappen === false
                ? 'bg-[var(--bucket-real)] text-white shadow-md'
                : 'bg-white border-2 border-[var(--input-border)] text-[var(--text)] hover:border-[var(--input-border-focus)] hover:-translate-y-0.5'
            }`}
          >
            没发生
          </button>
          <button
            type="button"
            onClick={() => setDidHappen(true)}
            className={`rounded-full px-6 py-3 text-sm transition-all duration-150 ${
              didHappen === true
                ? 'bg-[var(--bucket-catastrophic)] text-white shadow-md'
                : 'bg-white border-2 border-[var(--input-border)] text-[var(--text)] hover:border-[var(--input-border-focus)] hover:-translate-y-0.5'
            }`}
          >
            发生了
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="想记一句吗？（可选）"
          rows={2}
          className="w-full rounded-xl bg-white border-2 border-[var(--input-border)] focus:border-[var(--input-border-focus)] outline-none transition-colors duration-150 p-3 text-base leading-relaxed text-[var(--text)]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={didHappen === null || busy}
          className="self-center rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {busy ? '…' : '提交'}
        </button>
      </div>
    </main>
  );
}
