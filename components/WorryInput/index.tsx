// components/WorryInput/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { exampleAnxieties } from '@/data/exampleAnxieties';

const DRAFT_KEY = 'anxiety_decoder_draft';
const DEBOUNCE_MS = 2000;

interface WorryInputProps {
  onSubmit: (text: string) => void;
  busy: boolean;
  placeholder?: string;
  privacyLine?: string;
}

const DEFAULT_PLACEHOLDER =
  '把你现在脑子里所有担心倒出来。乱写也行，没关系。';
const DEFAULT_PRIVACY_LINE =
  '你写的东西只用来帮你解码这一次。原文 30 天后自动删除。';

export default function WorryInput({
  onSubmit,
  busy,
  placeholder = DEFAULT_PLACEHOLDER,
  privacyLine = DEFAULT_PRIVACY_LINE,
}: WorryInputProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setText(draft);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (text.length > 0) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    localStorage.removeItem(DRAFT_KEY);
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
        }}
        placeholder={placeholder}
        rows={6}
        disabled={busy}
        className="w-full rounded-xl bg-white border-2 border-[var(--input-border)] focus:border-[var(--input-border-focus)] outline-none transition-colors duration-150 p-4 text-base leading-relaxed text-[var(--text)] disabled:opacity-50"
      />
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[var(--text-muted)]">没思路？试试：</span>
        {exampleAnxieties.map((ex, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setText(ex)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] transition-colors duration-150 disabled:opacity-50"
            disabled={busy}
          >
            例 {i + 1}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">{privacyLine}</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || text.trim().length === 0}
          className="rounded-full bg-[var(--accent)] text-white px-6 py-2 text-sm hover:bg-[var(--input-border-focus)] hover:-translate-y-0.5 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {busy ? '解码中…' : '开始解码'}
        </button>
      </div>
    </div>
  );
}
