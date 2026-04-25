// components/WorryInput/index.tsx
'use client';

import { useEffect, useState } from 'react';
import { exampleAnxieties } from '@/data/exampleAnxieties';

const DRAFT_KEY = 'anxiety_decoder_draft';
const DEBOUNCE_MS = 2000;

interface WorryInputProps {
  onSubmit: (text: string) => void;
  busy: boolean;
}

export default function WorryInput({ onSubmit, busy }: WorryInputProps) {
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
        placeholder="把你现在脑子里所有担心倒出来。乱写也行，没关系。"
        rows={6}
        disabled={busy}
        className="w-full rounded-md border border-stone-300 bg-white p-4 text-base leading-relaxed text-stone-800 outline-none focus:border-stone-500 disabled:opacity-50"
      />
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-stone-500">没思路？试试：</span>
        {exampleAnxieties.map((ex, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setText(ex)}
            className="text-xs text-stone-600 underline hover:text-stone-800 disabled:opacity-50"
            disabled={busy}
          >
            例 {i + 1}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          你写的东西只用来帮你解码这一次。原文 30 天后自动删除。
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || text.trim().length === 0}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {busy ? '解码中…' : '开始解码'}
        </button>
      </div>
    </div>
  );
}
