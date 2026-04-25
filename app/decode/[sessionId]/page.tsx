// app/decode/[sessionId]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConversationTurn from '@/components/ConversationTurn';
import RetryError from '@/components/RetryError';
import { retryOnce } from '@/lib/retry';

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastReplyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { conversation?: UIMessage[] };
      if (!cancelled && data.conversation) {
        setMessages(
          data.conversation.map((m) => ({ role: m.role, content: m.content })),
        );
      }
    }
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sendReply = async (trimmed: string, optimistic: boolean) => {
    setBusy(true);
    setError(null);
    lastReplyRef.current = trimmed;
    if (optimistic) {
      setMessages((m) => [...m, { role: 'user', content: trimmed }]);
      setReply('');
    }

    try {
      await retryOnce(async () => {
        const res = await fetch(`/api/sessions/${sessionId}/turns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: trimmed }),
        });
        if (!res.ok) throw new Error(`turns ${res.status}`);
        const data = (await res.json()) as
          | { done: false; question: string }
          | { done: true };
        if (data.done) {
          const decodeRes = await fetch(`/api/sessions/${sessionId}/decode`, {
            method: 'POST',
          });
          if (!decodeRes.ok) throw new Error(`decode ${decodeRes.status}`);
          router.push(`/decode/${sessionId}/result`);
        } else {
          setMessages((m) => [...m, { role: 'assistant', content: data.question }]);
          setBusy(false);
        }
      });
    } catch {
      setError('AI 走神了，再来一次？');
      setBusy(false);
    }
  };

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed || busy) return;
    await sendReply(trimmed, true);
  };

  const handleRetry = () => {
    if (lastReplyRef.current) sendReply(lastReplyRef.current, false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <ConversationTurn key={i} role={m.role} content={m.content} />
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--card-border)] p-4 flex flex-col gap-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
            }}
            placeholder="继续说…"
            rows={3}
            disabled={busy}
            className="w-full rounded-xl bg-white border-2 border-[var(--input-border)] focus:border-[var(--input-border-focus)] outline-none transition-colors duration-150 p-3 text-base leading-relaxed text-[var(--text)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || reply.trim().length === 0}
            className="self-end rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {busy ? '处理中…' : '继续'}
          </button>
          {error && (
            <RetryError message={error} onRetry={handleRetry} busy={busy} />
          )}
        </div>
      </div>
    </main>
  );
}
