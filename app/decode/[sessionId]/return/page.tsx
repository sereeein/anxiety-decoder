// app/decode/[sessionId]/return/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
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
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
        <Image
          src="/illustrations/04-return.png"
          alt="一只橘色小猫舒展身体，旁边一只蓝色茶杯"
          width={400}
          height={533}
          className="cat-soft-mask w-56 md:w-64 h-auto"
        />
        <p className="font-handwriting-cn text-3xl text-[var(--text)]">收到。</p>
        <a
          href="/"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150"
        >
          再来一次
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">
        <Image
          src="/illustrations/04-return.png"
          alt="一只橘色小猫舒展身体，旁边一只蓝色茶杯"
          width={400}
          height={533}
          priority
          className="cat-soft-mask w-56 md:w-64 h-auto mx-auto"
        />
        <p className="font-handwriting-cn text-center text-2xl md:text-3xl text-[var(--text)]">
          刚才怎么样？
        </p>
        <div className="flex justify-center gap-8">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-4xl transition-transform duration-150 ${emoji === e ? 'scale-125' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
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
          className="w-full rounded-xl bg-white border-2 border-[var(--input-border)] focus:border-[var(--input-border-focus)] outline-none transition-colors duration-150 p-3 text-base leading-relaxed text-[var(--text)]"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!emoji || busy}
          className="self-center rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {busy ? '…' : '提交'}
        </button>
      </div>
    </main>
  );
}
