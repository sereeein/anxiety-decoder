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
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <p className="text-stone-500 text-sm">{error}</p>
      </main>
    );
  }
  if (!payload) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <p className="text-stone-500 text-sm">加载中…</p>
      </main>
    );
  }
  if (payload.responded_at) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-stone-700 text-xl">这条已经回答过了。</p>
        <p className="text-stone-500 text-sm">
          你当时的回答是：{payload.did_happen ? '发生了' : '没发生'}
        </p>
      </main>
    );
  }
  if (done) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-stone-700 text-xl">收到。</p>
        <a href="/" className="text-sm text-stone-500 underline">
          回到首页
        </a>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <p className="text-stone-700 text-lg text-center">
          你当时担心的那件事 —— 真的发生了吗？
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setDidHappen(false)}
            className={`rounded-full px-6 py-3 text-sm transition ${
              didHappen === false
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            没发生
          </button>
          <button
            type="button"
            onClick={() => setDidHappen(true)}
            className={`rounded-full px-6 py-3 text-sm transition ${
              didHappen === true
                ? 'bg-amber-700 text-white'
                : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
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
          className="w-full rounded-md border border-stone-300 bg-white p-3 text-sm outline-none focus:border-stone-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={didHappen === null || busy}
          className="self-center rounded-full bg-stone-800 px-6 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '…' : '提交'}
        </button>
      </div>
    </main>
  );
}
