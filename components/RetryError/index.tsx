// components/RetryError/index.tsx
'use client';

interface RetryErrorProps {
  message: string;
  onRetry: () => void;
  busy: boolean;
}

export default function RetryError({ message, onRetry, busy }: RetryErrorProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3 items-start">
      <p className="text-sm text-stone-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {busy ? '重试中…' : '再试一次'}
      </button>
    </div>
  );
}
