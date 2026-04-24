// app/decode/[sessionId]/return/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const EMOJIS = ['🙂', '😐', '😣'] as const;

export default function ReturnPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [emoji, setEmoji] = useState<(typeof EMOJIS)[number] | null>(null);
  const [oneLiner, setOneLiner] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!emoji) return;
    setBusy(true);
    try {
      await fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, oneLiner }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 gap-6">
        <p className="text-2xl text-stone-700">收到。</p>
        <a href="/" className="text-sm text-stone-500 underline">再来一次</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <p className="text-stone-700 text-center text-lg">刚才怎么样？</p>
        <div className="flex justify-center gap-6">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-4xl transition ${emoji === e ? 'scale-125' : 'opacity-60 hover:opacity-100'}`}
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
        <textarea
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="想说一句吗？（可选）"
          rows={2}
          className="w-full rounded-md border border-stone-300 bg-white p-3 text-sm outline-none focus:border-stone-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!emoji || busy}
          className="self-center rounded-full bg-stone-800 px-6 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '…' : '提交'}
        </button>
      </div>
    </main>
  );
}
